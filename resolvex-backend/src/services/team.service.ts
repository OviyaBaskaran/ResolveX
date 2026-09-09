import pool from "../config/database.js";

type TeamInput = {
  name: string;
  description?: string | undefined;
  managerId?: number | undefined;
};

const ensureOrganizationUser = async (userId: number, organizationId: number, managerOnly = false): Promise<void> => {
  const [rows] = await pool.query(
    `
      SELECT u.id
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
        AND u.organization_id = ?
        AND u.status = 'ACTIVE'
        ${managerOnly ? "AND r.code = 'MANAGER'" : ""}
      LIMIT 1
    `,
    [userId, organizationId]
  );

  if ((rows as { id: number }[]).length === 0) {
    throw new Error(managerOnly ? "MANAGER_NOT_FOUND" : "USER_NOT_FOUND");
  }
};

export const createTeam = async (input: TeamInput, organizationId: number) => {
  if (input.managerId !== undefined) {
    await ensureOrganizationUser(input.managerId, organizationId, true);
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO teams (organization_id, name, description, manager_id) VALUES (?, ?, ?, ?)`,
      [organizationId, input.name, input.description ?? null, input.managerId ?? null]
    );
    return getTeamById(Number((result as { insertId: number }).insertId), organizationId);
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      throw new Error("TEAM_ALREADY_EXISTS");
    }
    throw error;
  }
};

export const getTeamById = async (teamId: number, organizationId: number) => {
  const [rows] = await pool.query(
    `
      SELECT
        t.id, t.name, t.description, t.organization_id AS organizationId,
        t.manager_id AS managerId, u.name AS managerName
      FROM teams t
      LEFT JOIN users u ON u.id = t.manager_id
      WHERE t.id = ? AND t.organization_id = ?
      LIMIT 1
    `,
    [teamId, organizationId]
  );
  return (rows as Record<string, unknown>[])[0];
};

export const listTeams = async (organizationId: number) => {
  const [rows] = await pool.query(
    `
      SELECT
        t.id, t.name, t.description, t.organization_id AS organizationId,
        t.manager_id AS managerId, u.name AS managerName,
        COUNT(tm.user_id) AS memberCount
      FROM teams t
      LEFT JOIN users u ON u.id = t.manager_id
      LEFT JOIN team_members tm ON tm.team_id = t.id
      WHERE t.organization_id = ?
      GROUP BY t.id, t.name, t.description, t.organization_id, t.manager_id, u.name
      ORDER BY t.id DESC
    `,
    [organizationId]
  );
  return rows;
};

export const assignManager = async (teamId: number, organizationId: number, managerId: number | null): Promise<void> => {
  if (managerId !== null) {
    await ensureOrganizationUser(managerId, organizationId, true);
  }

  const [result] = await pool.query(
    "UPDATE teams SET manager_id = ? WHERE id = ? AND organization_id = ?",
    [managerId, teamId, organizationId]
  );
  if ((result as { affectedRows: number }).affectedRows === 0) {
    throw new Error("TEAM_NOT_FOUND");
  }
};

export const addMember = async (teamId: number, organizationId: number, userId: number): Promise<void> => {
  const team = await getTeamById(teamId, organizationId);
  if (!team) {
    throw new Error("TEAM_NOT_FOUND");
  }
  await ensureOrganizationUser(userId, organizationId);

  try {
    await pool.query("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)", [teamId, userId]);
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      throw new Error("MEMBER_ALREADY_EXISTS");
    }
    throw error;
  }
};

export const removeMember = async (teamId: number, organizationId: number, userId: number): Promise<void> => {
  const [result] = await pool.query(
    `
      DELETE tm FROM team_members tm
      INNER JOIN teams t ON t.id = tm.team_id
      WHERE tm.team_id = ? AND tm.user_id = ? AND t.organization_id = ?
    `,
    [teamId, userId, organizationId]
  );
  if ((result as { affectedRows: number }).affectedRows === 0) {
    throw new Error("MEMBER_NOT_FOUND");
  }
};

export const listMembers = async (teamId: number, organizationId: number) => {
  const [rows] = await pool.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.organization_id AS organizationId,
        r.code AS roleCode,
        u.status
      FROM team_members tm
      INNER JOIN teams t ON t.id = tm.team_id
      INNER JOIN users u ON u.id = tm.user_id
      INNER JOIN roles r ON r.id = u.role_id
      WHERE tm.team_id = ?
        AND t.organization_id = ?
      ORDER BY u.name ASC
    `,
    [teamId, organizationId]
  );

  return rows;
};