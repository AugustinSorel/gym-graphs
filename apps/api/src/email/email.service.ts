import type { Email } from "~/libs/email";
import type { User } from "~/db/db.schemas";

const sendEmailVerificationCode = async (
  toAddress: User["email"],
  body: string,
  email: Email,
) => {
  const config = email.buildConfig([toAddress], "Verification code", body);

  return email.client.send(config);
};

export const emailService = {
  sendEmailVerificationCode,
};
