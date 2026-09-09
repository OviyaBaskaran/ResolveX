import dotenv from "dotenv";

dotenv.config();

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv: process.env.NODE_ENV ?? "development",

  auth: {
    accessTokenSecret: requiredEnv("JWT_ACCESS_SECRET"),
    refreshTokenSecret: requiredEnv("JWT_REFRESH_SECRET"),
    accessTokenExpiresInSeconds: Number(process.env.JWT_ACCESS_EXPIRES_SECONDS ?? 1800),
    refreshTokenExpiresInSeconds: Number(process.env.JWT_REFRESH_EXPIRES_SECONDS ?? 604800)
  },

  db: {
    host: requiredEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 3306),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    name: requiredEnv("DB_NAME")
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? ""
  }
};