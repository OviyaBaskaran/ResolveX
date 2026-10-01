import request from "supertest";
import type { RowDataPacket } from "mysql2";

import app from "../../src/app.js";
import pool from "../../src/config/database.js";
import { env } from "../../src/config/env.js";

import {
  hashRefreshToken,
} from "../../src/modules/auth/auth.tokens.js";

import {
  ACTIVE_ORG,
  PENDING_ORG,
} from "../fixtures/organization.fixtures.js";

type OrganizationRow =
  RowDataPacket & {
    id: number;
  };

type RefreshTokenRow =
  RowDataPacket & {
    token_hash: string;
    revoked_at: Date | null;
    expires_at: Date;
  };

  type OrganizationFixture = {
  code: string;
  name: string;
  timezone: string;
  contactEmail: string;
  contactPhone: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

async function deleteOrganizationByCode(
  code: string,
): Promise<void> {
  const [rows] =
    await pool.query<OrganizationRow[]>(
      `
        SELECT id
        FROM organizations
        WHERE code = ?
        LIMIT 1
      `,
      [code],
    );

  const organization = rows[0];

  if (!organization) {
    return;
  }

  const organizationId =
    organization.id;

  /*
   * Delete dependent records first because
   * ResolveX intentionally uses strong
   * foreign-key constraints.
   */

  await pool.query(
    `
      DELETE FROM refresh_tokens
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM password_reset_tokens
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM notifications
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_attachments
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_internal_notes
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_comments
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_status_history
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_assignment_history
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_sla
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM tickets
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM team_members
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM teams
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM audit_logs
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM users
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM roles
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM organizations
      WHERE id = ?
    `,
    [organizationId],
  );
}

async function registerOrganization(
  organization: OrganizationFixture,
): Promise<number> {
  const response = await request(app)
    .post(
      "/api/v1/organizations/register",
    )
    .send(organization);

  expect(response.status).toBe(201);

  const [rows] =
    await pool.query<OrganizationRow[]>(
      `
        SELECT id
        FROM organizations
        WHERE code = ?
        LIMIT 1
      `,
      [organization.code],
    );

  const createdOrganization =
    rows[0];

  expect(
    createdOrganization,
  ).toBeDefined();

  if (!createdOrganization) {
    throw new Error(
      `Organization ${organization.code} was not created`,
    );
  }

  return createdOrganization.id;
}

async function getPlatformAccessToken(): Promise<string> {
  const response = await request(app)
    .post(
      "/api/v1/platform/auth/login",
    )
    .send({
      email: env.platformAdmin.email,
      password:
        env.platformAdmin.password,
    });

  expect(response.status).toBe(200);

  const accessToken =
    response.body?.data?.accessToken;

  expect(
    typeof accessToken,
  ).toBe("string");

  return accessToken as string;
}

async function activateOrganization(
  organizationId: number,
): Promise<void> {
  const platformAccessToken =
    await getPlatformAccessToken();

  const response = await request(app)
    .patch(
      `/api/v1/platform/organizations/${organizationId}/status`,
    )
    .set(
      "Authorization",
      `Bearer ${platformAccessToken}`,
    )
    .send({
      status: "ACTIVE",
    });

  expect(response.status).toBe(200);

  expect(response.body).toEqual({
    success: true,
    message:
      "Organization status updated successfully",
  });

  /*
   * Verify that the approval API actually
   * persisted the ACTIVE status.
   */
  const [rows] =
    await pool.query<
      Array<
        RowDataPacket & {
          status:
            | "PENDING"
            | "ACTIVE"
            | "DISABLED";
        }
      >
    >(
      `
        SELECT status
        FROM organizations
        WHERE id = ?
        LIMIT 1
      `,
      [organizationId],
    );

  const organization = rows[0];

  expect(organization).toBeDefined();

  if (!organization) {
    throw new Error(
      "Organization was not found after activation",
    );
  }

  expect(
    organization.status,
  ).toBe("ACTIVE");
}

async function getUserIdByEmail(
  email: string,
): Promise<number> {
  const [rows] =
    await pool.query<
      Array<
        RowDataPacket & {
          id: number;
        }
      >
    >(
      `
        SELECT id
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [email],
    );

  const user = rows[0];

  if (!user) {
    throw new Error(
      `User ${email} was not found`,
    );
  }

  return user.id;
}

/*
 * Creates a persistent Supertest client.
 *
 * The agent stores the refresh-token cookie
 * returned by the login response and sends it
 * automatically on subsequent requests.
 */
async function loginWithAgent() {
  const agent = request.agent(app);

  const response = await agent
    .post("/api/v1/auth/login")
    .send({
      organizationCode:
        ACTIVE_ORG.code,
      email:
        ACTIVE_ORG.adminEmail,
      password:
        ACTIVE_ORG.adminPassword,
    });

  expect(response.status).toBe(200);

  return {
    agent,
    response,
  };
}

/*
 * Extract the ResolveX refresh-token cookie
 * from a Set-Cookie response header.
 */
function getRefreshTokenCookie(
  setCookie:
    | string
    | string[]
    | undefined,
): string {
  if (!setCookie) {
    throw new Error(
      "Refresh token cookie was not returned",
    );
  }

  const cookies = Array.isArray(
    setCookie,
  )
    ? setCookie
    : [setCookie];

  const refreshCookie =
    cookies.find((cookie) =>
      cookie.startsWith(
        "resolvex_refresh_token=",
      ),
    );

  if (!refreshCookie) {
    throw new Error(
      "Refresh token cookie was not found",
    );
  }

  return refreshCookie;
}

function getRefreshTokenValue(
  cookie: string,
): string {
  const cookieValue =
    cookie.split(";")[0];

  if (!cookieValue) {
    throw new Error(
      "Invalid refresh token cookie",
    );
  }

  const separatorIndex =
    cookieValue.indexOf("=");

  if (separatorIndex === -1) {
    throw new Error(
      "Invalid refresh token cookie",
    );
  }

  return cookieValue.slice(
    separatorIndex + 1,
  );
}

describe(
  "Organization Authentication",
  () => {
    let activeOrganizationId: number;

    beforeAll(async () => {
      /*
       * Start from a known database state.
       */
      await deleteOrganizationByCode(
        ACTIVE_ORG.code,
      );

      await deleteOrganizationByCode(
        PENDING_ORG.code,
      );

      /*
       * Register the organization.
       *
       * Newly registered organizations
       * start with PENDING status.
       */
      activeOrganizationId =
        await registerOrganization(
          ACTIVE_ORG,
        );

      /*
       * Activate the organization through
       * the real Platform Admin API.
       */
      await activateOrganization(
        activeOrganizationId,
      );

      /*
       * Register a separate organization
       * that remains PENDING.
       */
      await registerOrganization(
        PENDING_ORG,
      );
    });

    afterAll(async () => {
      await deleteOrganizationByCode(
        ACTIVE_ORG.code,
      );

      await deleteOrganizationByCode(
        PENDING_ORG.code,
      );
    });

    it(
      "should reject login when organization is pending",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/auth/login",
            )
            .send({
              organizationCode:
                PENDING_ORG.code,
              email:
                PENDING_ORG.adminEmail,
              password:
                PENDING_ORG.adminPassword,
            });

        expect(response.status).toBe(
          401,
        );

        expect(
          response.body,
        ).toMatchObject({
          success: false,
          message:
            "Organization is not active",
        });
      },
    );

    it(
      "should reject login with an incorrect password",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/auth/login",
            )
            .send({
              organizationCode:
                ACTIVE_ORG.code,
              email:
                ACTIVE_ORG.adminEmail,
              password:
                "WrongPassword@123",
            });

        expect(response.status).toBe(
          401,
        );

        expect(
          response.body,
        ).toMatchObject({
          success: false,
          message:
            "Invalid organization code, email, or password",
        });
      },
    );

    it(
      "should reject login for an unknown organization",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/auth/login",
            )
            .send({
              organizationCode:
                "UNKNOWN_ORG",
              email:
                ACTIVE_ORG.adminEmail,
              password:
                ACTIVE_ORG.adminPassword,
            });

        expect(response.status).toBe(
          401,
        );

        expect(
          response.body,
        ).toMatchObject({
          success: false,
          message:
            "Invalid organization code, email, or password",
        });
      },
    );

    it(
      "should reject login for a disabled user",
      async () => {
        const userId =
          await getUserIdByEmail(
            ACTIVE_ORG.adminEmail,
          );

        await pool.execute(
          `
            UPDATE users
            SET
              status = 'DISABLED',
              disabled_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
          [userId],
        );

        try {
          const response =
            await request(app)
              .post(
                "/api/v1/auth/login",
              )
              .send({
                organizationCode:
                  ACTIVE_ORG.code,
                email:
                  ACTIVE_ORG.adminEmail,
                password:
                  ACTIVE_ORG.adminPassword,
              });

          expect(
            response.status,
          ).toBe(401);

          expect(
            response.body,
          ).toMatchObject({
            success: false,
            message:
              "User account is disabled",
          });
        } finally {
          /*
           * Restore fixture state so later
           * tests remain independent.
           */
          await pool.execute(
            `
              UPDATE users
              SET
                status = 'ACTIVE',
                disabled_at = NULL
              WHERE id = ?
            `,
            [userId],
          );
        }
      },
    );

    it(
      "should login successfully with valid credentials",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/auth/login",
            )
            .send({
              organizationCode:
                ACTIVE_ORG.code,
              email:
                ACTIVE_ORG.adminEmail,
              password:
                ACTIVE_ORG.adminPassword,
            });

        expect(response.status).toBe(
          200,
        );

        expect(
          response.body,
        ).toMatchObject({
          success: true,
          message:
            "Login successful",
        });

        expect(
          response.body.data.accessToken,
        ).toEqual(
          expect.any(String),
        );

        /*
         * Refresh token must NOT be
         * exposed in the JSON response.
         */
        expect(
          response.body.data
            .refreshToken,
        ).toBeUndefined();

        expect(
          response.body.data.user,
        ).toMatchObject({
          name:
            ACTIVE_ORG.adminName,
          email:
            ACTIVE_ORG.adminEmail,
          organizationCode:
            ACTIVE_ORG.code,
          mustChangePassword: false,
        });

        expect(
          response.body.data.user
            .role.code,
        ).toBe(
          "ORGANIZATION_ADMIN",
        );

        /*
         * Password/hash must never
         * be exposed.
         */
        expect(
          response.body.data.user
            .password,
        ).toBeUndefined();

        expect(
          response.body.data.user
            .passwordHash,
        ).toBeUndefined();

        expect(
          response.body.data
            .passwordHash,
        ).toBeUndefined();

        /*
         * Refresh token must be delivered
         * through an HttpOnly cookie.
         */
        const refreshCookie =
          getRefreshTokenCookie(
            response.headers[
              "set-cookie"
            ],
          );

        expect(
          refreshCookie,
        ).toContain("HttpOnly");
      },
    );

    it(
      "should update the user's last login timestamp after successful authentication",
      async () => {
        const userId =
          await getUserIdByEmail(
            ACTIVE_ORG.adminEmail,
          );

        await pool.execute(
          `
            UPDATE users
            SET last_login_at = NULL
            WHERE id = ?
          `,
          [userId],
        );

        const response =
          await request(app)
            .post(
              "/api/v1/auth/login",
            )
            .send({
              organizationCode:
                ACTIVE_ORG.code,
              email:
                ACTIVE_ORG.adminEmail,
              password:
                ACTIVE_ORG.adminPassword,
            });

        expect(response.status).toBe(
          200,
        );

        const [rows] =
          await pool.query<
            Array<
              RowDataPacket & {
                last_login_at:
                  | Date
                  | null;
              }
            >
          >(
            `
              SELECT last_login_at
              FROM users
              WHERE id = ?
              LIMIT 1
            `,
            [userId],
          );

        const user = rows[0];

        expect(user).toBeDefined();

        if (!user) {
          throw new Error(
            "User was not found after successful login",
          );
        }

        expect(
          user.last_login_at,
        ).not.toBeNull();

        expect(
          new Date(
            user.last_login_at as Date,
          ).getTime(),
        ).toBeLessThanOrEqual(
          Date.now(),
        );
      },
    );

    it(
      "should persist the refresh token as a hash",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/auth/login",
            )
            .send({
              organizationCode:
                ACTIVE_ORG.code,
              email:
                ACTIVE_ORG.adminEmail,
              password:
                ACTIVE_ORG.adminPassword,
            });

        expect(response.status).toBe(
          200,
        );

        const refreshCookie =
          getRefreshTokenCookie(
            response.headers[
              "set-cookie"
            ],
          );

        const refreshToken =
          getRefreshTokenValue(
            refreshCookie,
          );

        expect(
          refreshToken.length,
        ).toBeGreaterThan(0);

        const userId =
          await getUserIdByEmail(
            ACTIVE_ORG.adminEmail,
          );

        const [rows] =
          await pool.query<
            RefreshTokenRow[]
          >(
            `
              SELECT
                token_hash,
                revoked_at,
                expires_at
              FROM refresh_tokens
              WHERE user_id = ?
              ORDER BY id DESC
              LIMIT 1
            `,
            [userId],
          );

        const refreshTokenRow =
          rows[0];

        expect(
          refreshTokenRow,
        ).toBeDefined();

        if (!refreshTokenRow) {
          throw new Error(
            "Refresh token was not persisted",
          );
        }

        /*
         * Raw refresh token must never
         * be stored in the database.
         */
        expect(
          refreshTokenRow.token_hash,
        ).not.toBe(refreshToken);

        expect(
          refreshTokenRow.token_hash,
        ).toBe(
          hashRefreshToken(
            refreshToken,
          ),
        );

        /*
         * SHA-256 hex string =
         * 64 characters.
         */
        expect(
          refreshTokenRow.token_hash,
        ).toMatch(
          /^[a-f0-9]{64}$/,
        );

        expect(
          refreshTokenRow.revoked_at,
        ).toBeNull();

        expect(
          new Date(
            refreshTokenRow.expires_at,
          ).getTime(),
        ).toBeGreaterThan(
          Date.now(),
        );
      },
    );

    it(
      "should reject an invalid request body",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/auth/login",
            )
            .send({
              organizationCode:
                ACTIVE_ORG.code,
              email:
                "not-an-email",
              password: "",
            });

        expect(response.status).toBe(
          400,
        );

        expect(
          response.body,
        ).toMatchObject({
          success: false,
          message:
            "Validation failed",
        });
      },
    );

    it(
      "should set and use the refresh token through an HttpOnly cookie",
      async () => {
        const {
          agent,
          response: loginResponse,
        } = await loginWithAgent();

        const loginCookie =
          getRefreshTokenCookie(
            loginResponse.headers[
              "set-cookie"
            ],
          );

        expect(
          loginCookie,
        ).toContain("HttpOnly");

        const refreshResponse =
          await agent.post(
            "/api/v1/auth/refresh",
          );

        expect(
          refreshResponse.status,
        ).toBe(200);

        expect(
          refreshResponse.body,
        ).toMatchObject({
          success: true,
          message:
            "Token refreshed successfully",
        });

        expect(
          refreshResponse.body.data
            .accessToken,
        ).toEqual(
          expect.any(String),
        );

        expect(
          refreshResponse.body.data
            .refreshToken,
        ).toBeUndefined();

        expect(
          refreshResponse.body.data
            .user,
        ).toBeDefined();

        const rotatedCookie =
          getRefreshTokenCookie(
            refreshResponse.headers[
              "set-cookie"
            ],
          );

        expect(
          rotatedCookie,
        ).toContain("HttpOnly");

        expect(
          rotatedCookie,
        ).not.toBe(loginCookie);
      },
    );

    it(
      "should reject reuse of a rotated refresh token",
      async () => {
        const {
          agent,
          response: loginResponse,
        } = await loginWithAgent();

        const oldCookie =
          getRefreshTokenCookie(
            loginResponse.headers[
              "set-cookie"
            ],
          );

        const firstRefresh =
          await agent.post(
            "/api/v1/auth/refresh",
          );

        expect(
          firstRefresh.status,
        ).toBe(200);

        /*
         * Try to reuse the original
         * refresh token after rotation.
         */
        const secondRefresh =
          await request(app)
            .post(
              "/api/v1/auth/refresh",
            )
            .set(
              "Cookie",
              oldCookie,
            );

        expect(
          secondRefresh.status,
        ).toBe(401);

        expect(
          secondRefresh.body.message,
        ).toBe(
          "Refresh token has been revoked",
        );
      },
    );

    it(
      "should allow the newly issued refresh token to be used",
      async () => {
        const { agent } =
          await loginWithAgent();

        const firstRefresh =
          await agent.post(
            "/api/v1/auth/refresh",
          );

        expect(
          firstRefresh.status,
        ).toBe(200);

        /*
         * The Supertest agent automatically
         * stores the newly issued cookie.
         */
        const secondRefresh =
          await agent.post(
            "/api/v1/auth/refresh",
          );

        expect(
          secondRefresh.status,
        ).toBe(200);

        expect(
          secondRefresh.body.data
            .accessToken,
        ).toEqual(
          expect.any(String),
        );

        expect(
          secondRefresh.body.data
            .refreshToken,
        ).toBeUndefined();

        expect(
          secondRefresh.headers[
            "set-cookie"
          ],
        ).toBeDefined();
      },
    );

    it(
      "should reject refresh when the refresh token cookie is missing",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/auth/refresh",
            );

        expect(response.status).toBe(
          401,
        );

        expect(
          response.body,
        ).toMatchObject({
          success: false,
          message:
            "Refresh token is missing",
        });
      },
    );

    it(
      "should reject an invalid refresh token cookie",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/auth/refresh",
            )
            .set(
              "Cookie",
              "resolvex_refresh_token=invalid-refresh-token",
            );

        expect(response.status).toBe(
          401,
        );

        expect(
          response.body,
        ).toMatchObject({
          success: false,
          message:
            "Invalid refresh token",
        });
      },
    );

    it(
      "should revoke the old token and link it to the new token",
      async () => {
        const {
          agent,
          response: loginResponse,
        } = await loginWithAgent();

        const oldCookie =
          getRefreshTokenCookie(
            loginResponse.headers[
              "set-cookie"
            ],
          );

        const oldRefreshToken =
          getRefreshTokenValue(
            oldCookie,
          );

        const oldTokenHash =
          hashRefreshToken(
            oldRefreshToken,
          );

        const firstRefresh =
          await agent.post(
            "/api/v1/auth/refresh",
          );

        expect(
          firstRefresh.status,
        ).toBe(200);

        const newCookie =
          getRefreshTokenCookie(
            firstRefresh.headers[
              "set-cookie"
            ],
          );

        const newRefreshToken =
          getRefreshTokenValue(
            newCookie,
          );

        const newTokenHash =
          hashRefreshToken(
            newRefreshToken,
          );

        const [rows] =
          await pool.query<
            Array<
              RowDataPacket & {
                id: number;
                token_hash: string;
                revoked_at:
                  | Date
                  | null;
                replaced_by_token_id:
                  | number
                  | null;
              }
            >
          >(
            `
              SELECT
                id,
                token_hash,
                revoked_at,
                replaced_by_token_id
              FROM refresh_tokens
              WHERE token_hash IN (?, ?)
              ORDER BY id
            `,
            [
              oldTokenHash,
              newTokenHash,
            ],
          );

        expect(rows).toHaveLength(2);

        const oldToken =
          rows.find(
            (row) =>
              row.token_hash ===
              oldTokenHash,
          );

        const newToken =
          rows.find(
            (row) =>
              row.token_hash ===
              newTokenHash,
          );

        expect(
          oldToken,
        ).toBeDefined();

        expect(
          newToken,
        ).toBeDefined();

        if (
          !oldToken ||
          !newToken
        ) {
          throw new Error(
            "Rotated refresh tokens were not found",
          );
        }

        expect(
          oldToken.revoked_at,
        ).not.toBeNull();

        expect(
          oldToken.replaced_by_token_id,
        ).toBe(newToken.id);

        expect(
          newToken.revoked_at,
        ).toBeNull();
      },
    );
  },
);