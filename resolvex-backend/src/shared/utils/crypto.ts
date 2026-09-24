import { randomBytes } from "node:crypto";

export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}