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
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",").map((origin) => origin.trim()).filter(Boolean),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",

  email: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    password: process.env.SMTP_PASSWORD ?? "",
    from: process.env.SMTP_FROM ?? ""
  },

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
