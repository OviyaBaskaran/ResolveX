export type PlatformAdmin = {
  id: number;
  name: string;
  email: string;
};

export type PlatformTokenPayload = {
  sub: string;
  name: string;
  email: string;
  tokenType: "PLATFORM_ADMIN";
};
