import { randomBytes } from "crypto";

export const generateSessionToken = () => {
  const bytes = randomBytes(20);

  return bytes.toString("base64");
};
export type SessionToken = ReturnType<typeof generateSessionToken>;
