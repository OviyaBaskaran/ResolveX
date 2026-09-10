import bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { env } from "../config/env.js";
import type { AccessTokenPayload, AuthUser } from "../types/auth.js";

type LoginInput = { organizationSlug: string; email: string; password: string };
type RegisterInput = LoginInput & { name: string };

type UserRow = AuthUser & {
  passwordHash: string;
  userStatus: "ACTIVE" | "DISABLED";
  organizationStatus: "ACTIVE" | "DISABLED";
};

type RefreshTokenRow = {
  id: number;
  tokenHash: string;
};

type PasswordResetTokenRow = {
  id: number;
  userId: number;
  tokenHash: string;
};

type PasswordResetRecipient = { id: number; name: string; email: string };

const invalidCredentials = (): never => {
  throw new Error("INVALID_CREDENTIALS");
};

const createAccessToken = (user: AuthUser): string => {
  const payload: AccessTokenPayload = {
    sub: String(user.id),
    name: user.name,
    email: user.email,
    organizationId: user.organizationId,
    roleId: user.roleId,
    roleCode: user.roleCode
  };

  return jwt.sign(payload, env.auth.accessTokenSecret, {
    expiresIn: env.auth.accessTokenExpiresInSeconds
  });
};

const createRefreshToken = (userId: number): string =>
  jwt.sign({ sub: String(userId) }, env.auth.refreshTokenSecret, {
    expiresIn: env.auth.refreshTokenExpiresInSeconds
  });

const storeRefreshToken = async (userId: number, refreshToken: string): Promise<void> => {
  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  await pool.query(
    `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
    `,
    [userId, refreshTokenHash]
  );
};

const getUserById = async (userId: number): Promise<AuthUser | undefined> => {
  const [rows] = await pool.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.organization_id AS organizationId,
        u.role_id AS roleId,
        r.code AS roleCode
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      INNER JOIN organizations o ON o.id = u.organization_id
      WHERE u.id = ?
        AND u.status = 'ACTIVE'
        AND o.status = 'ACTIVE'
      LIMIT 1
    `,
    [userId]
  );

  return (rows as AuthUser[])[0];
};

const createTokenPair = async (user: AuthUser): Promise<{
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}> => {
  const refreshToken = createRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);

  return {
    user,
    accessToken: createAccessToken(user),
    refreshToken
  };
};

export const loginUser = async (input: LoginInput): Promise<{
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}> => {
  const [rows] = await pool.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.organization_id AS organizationId,
        u.role_id AS roleId,
        u.password_hash AS passwordHash,
        u.status AS userStatus,
        r.code AS roleCode,
        o.status AS organizationStatus
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      INNER JOIN organizations o ON o.id = u.organization_id
      WHERE u.email = ?
        AND o.slug = ?
      LIMIT 1
    `,
    [input.email.toLowerCase(), input.organizationSlug]
  );

  const user = (rows as UserRow[])[0];

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (user.userStatus !== "ACTIVE" || user.organizationStatus !== "ACTIVE") {
    invalidCredentials();
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    invalidCredentials();
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    organizationId: user.organizationId,
    roleId: user.roleId,
    roleCode: user.roleCode
  };
  const tokens = await createTokenPair(authUser);
  await pool.query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);

  return tokens;
};

export const registerUser = async (input: RegisterInput): Promise<{
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [organizationRows] = await connection.query(
      `SELECT id FROM organizations WHERE slug = ? AND status = 'ACTIVE' LIMIT 1`,
      [input.organizationSlug]
    );
    const organization = (organizationRows as { id: number }[])[0];

    if (!organization) {
      throw new Error("ORGANIZATION_NOT_FOUND");
    }

    const [roleRows] = await connection.query(
      `SELECT id FROM roles WHERE organization_id = ? AND code = 'CUSTOMER' LIMIT 1`,
      [organization.id]
    );
    const customerRole = (roleRows as { id: number }[])[0];

    if (!customerRole) {
      throw new Error("CUSTOMER_ROLE_NOT_FOUND");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const [insertResult] = await connection.query(
      `
        INSERT INTO users (organization_id, role_id, name, email, password_hash, status)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE')
      `,
      [organization.id, customerRole.id, input.name, input.email.toLowerCase(), passwordHash]
    );
    const userId = Number((insertResult as { insertId: number }).insertId);

    const user: AuthUser = {
      id: userId,
      name: input.name,
      email: input.email.toLowerCase(),
      organizationId: organization.id,
      roleId: customerRole.id,
      roleCode: "CUSTOMER"
    };

    await connection.commit();
    return createTokenPair(user);
  } catch (error) {
    await connection.rollback();

    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    throw error;
  } finally {
    connection.release();
  }
};

const hashResetToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const requestPasswordReset = async (input: {
  organizationSlug: string;
  email: string;
}): Promise<{ token: string; recipient: PasswordResetRecipient } | undefined> => {
  const [rows] = await pool.query(
    `
      SELECT u.id, u.name, u.email
      FROM users u
      INNER JOIN organizations o ON o.id = u.organization_id
      WHERE u.email = ?
        AND o.slug = ?
        AND u.status = 'ACTIVE'
        AND o.status = 'ACTIVE'
      LIMIT 1
    `,
    [input.email.toLowerCase(), input.organizationSlug]
  );
  const user = (rows as PasswordResetRecipient[])[0];

  if (!user) {
    return undefined;
  }

  const token = randomBytes(32).toString("hex");
  await pool.query(
    `
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND used_at IS NULL
    `,
    [user.id]
  );
  await pool.query(
    `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))
    `,
    [user.id, hashResetToken(token)]
  );

  return { token, recipient: user };
};

export const resetPassword = async (token: string, password: string): Promise<void> => {
  const tokenHash = hashResetToken(token);
  const [rows] = await pool.query(
    `
      SELECT id, user_id AS userId, token_hash AS tokenHash
      FROM password_reset_tokens
      WHERE token_hash = ?
        AND used_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `,
    [tokenHash]
  );
  const resetToken = (rows as PasswordResetTokenRow[])[0];

  if (!resetToken) {
    throw new Error("INVALID_RESET_TOKEN");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ? AND status = 'ACTIVE'", [passwordHash, resetToken.userId]);
  await pool.query("UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?", [resetToken.id]);
  await pool.query("UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL", [resetToken.userId]);
};

export const refreshUserSession = async (refreshToken: string): Promise<{
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}> => {
  let payload: { sub?: string };

  try {
    payload = jwt.verify(refreshToken, env.auth.refreshTokenSecret) as { sub?: string };
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const userId = Number(payload.sub);
  const user = Number.isSafeInteger(userId) ? await getUserById(userId) : undefined;

  if (!user) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const [rows] = await pool.query(
    `
      SELECT id, token_hash AS tokenHash
      FROM refresh_tokens
      WHERE user_id = ?
        AND revoked_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
    `,
    [user.id]
  );

  let matchingToken: RefreshTokenRow | undefined;

  for (const row of rows as RefreshTokenRow[]) {
    if (await bcrypt.compare(refreshToken, row.tokenHash)) {
      matchingToken = row;
      break;
    }
  }

  if (!matchingToken) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  await pool.query("UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?", [matchingToken.id]);
  return createTokenPair(user);
};

export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    const payload = jwt.verify(refreshToken, env.auth.refreshTokenSecret) as { sub?: string };
    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId)) {
      return;
    }

    const [rows] = await pool.query(
      `SELECT id, token_hash AS tokenHash FROM refresh_tokens WHERE user_id = ? AND revoked_at IS NULL`,
      [userId]
    );

    for (const row of rows as RefreshTokenRow[]) {
      if (await bcrypt.compare(refreshToken, row.tokenHash)) {
        await pool.query("UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?", [row.id]);
        return;
      }
    }
  } catch {
    // Logout remains idempotent for missing, expired, or already-invalid cookies.
  }
};

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.auth.accessTokenSecret) as AccessTokenPayload;
