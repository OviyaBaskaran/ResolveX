import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const isConfigured = (): boolean => Boolean(env.email.host && env.email.user && env.email.password && env.email.from);

export const sendPasswordResetEmail = async (recipient: { email: string; name: string }, token: string): Promise<void> => {
  if (!isConfigured()) {
    if (env.nodeEnv === "production") throw new Error("EMAIL_NOT_CONFIGURED");
    return;
  }

  const resetUrl = new URL("/reset-password", env.frontendUrl);
  resetUrl.searchParams.set("token", token);
  const transport = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: { user: env.email.user, pass: env.email.password }
  });

  await transport.sendMail({
    from: env.email.from,
    to: recipient.email,
    subject: "Reset your ResolveX password",
    text: `Hello ${recipient.name}, reset your password using this link: ${resetUrl.toString()}\nThis link expires in 30 minutes.`
  });
};
