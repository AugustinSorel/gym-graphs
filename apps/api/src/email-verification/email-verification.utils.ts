import { randomInt } from "crypto";

export const generateEmailVerificationCode = () => {
  return Array.from({ length: 6 }, () => randomInt(0, 10)).join("");
};
