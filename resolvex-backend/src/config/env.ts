import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  ACCESS_TOKEN_EXPIRES_IN: z.string().min(1),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1),

  FRONTEND_URL: z.string().url(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:", parsedEnv.error);
  process.exit(1);
}

export const env = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,

  db: {
    host: parsedEnv.data.DB_HOST,
    port: parsedEnv.data.DB_PORT,
    name: parsedEnv.data.DB_NAME,
    user: parsedEnv.data.DB_USER,
    password: parsedEnv.data.DB_PASSWORD,
  },

  jwt: {
    accessSecret: parsedEnv.data.JWT_ACCESS_SECRET,
    refreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
    accessExpiresIn: parsedEnv.data.ACCESS_TOKEN_EXPIRES_IN,
    refreshExpiresIn: parsedEnv.data.REFRESH_TOKEN_EXPIRES_IN,
  },

  frontendUrl: parsedEnv.data.FRONTEND_URL,
};