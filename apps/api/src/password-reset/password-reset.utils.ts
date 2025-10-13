import { randomBytes } from "crypto";

export const generatePasswordResetToken = () => {
  const bytes = randomBytes(20);

  return bytes.toString("base64url");
};
