import { generateEmailVerificationCode } from "~/email-verification/email-verification.utils";
import type { User } from "~/db/db.schemas";
import type { createEmailVerificationRepo } from "~/email-verification/email-verification.repo";

export const createEmailVerificationService = (
  repo: ReturnType<typeof createEmailVerificationRepo>,
) => {
  return {
    create: async (userId: User["id"]) => {
      const emailVerificationCode = generateEmailVerificationCode();

      const emailVerification = await repo.create(
        emailVerificationCode,
        userId,
      );

      return emailVerification;
    },
  };
};
