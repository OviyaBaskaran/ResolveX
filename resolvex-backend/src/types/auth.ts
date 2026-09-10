export type AuthUser = {
  id: number;
  name: string;
  email: string;
  organizationId: number;
  roleId: number;
  roleCode: string;
};

export type AccessTokenPayload = {
  sub: string;
  name: string;
  email: string;
  organizationId: number;
  roleId: number;
  roleCode: string;
  tokenType?: "ORGANIZATION_USER" | "PLATFORM_ADMIN";
};