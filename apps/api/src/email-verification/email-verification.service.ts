import { generateEmailVerificationCode } from "~/email-verification/email-verification.utils";
import type { User } from "~/db/db.schemas";
import { emailVerificationRepo } from "~/email-verification/email-verification.repo";
import type { Db } from "~/libs/db";

const create = async (userId: User["id"], db: Db) => {
  const emailVerificationCode = generateEmailVerificationCode();

  const emailVerification = await emailVerificationRepo.create(
    emailVerificationCode,
    userId,
    db,
  );

  return emailVerification;
};

export const emailVerificationService = {
  create,
};
