import type { Email } from "~/libs/email";
import type { User } from "~/db/db.schemas";

export const createEmailService = (email: Email) => {
  return {
    sendEmailVerificationCode: async (
      toAddress: User["email"],
      body: string,
    ) => {
      const config = email.buildConfig([toAddress], "Verification code", body);

      return email.client.send(config);
    },
  };
};
