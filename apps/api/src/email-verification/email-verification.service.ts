import { generateEmailVerificationCode } from "~/email-verification/email-verification.utils";
import { emailVerificationRepo } from "~/email-verification/email-verification.repo";
import { userRepo } from "~/user/user.repo";
import { HTTPException } from "hono/http-exception";
import type { Db } from "~/libs/db";
import type { EmailVerificationCode, User } from "~/db/db.schemas";

const create = async (userId: User["id"], db: Db) => {
  const emailVerificationCode = generateEmailVerificationCode();

  const emailVerification = await emailVerificationRepo.create(
    emailVerificationCode,
    userId,
    db,
  );

  if (!emailVerification) {
    throw new HTTPException(404, {
      message: "email verification code not found",
    });
  }

  return emailVerification;
};

const verifyCode = async (
  userId: EmailVerificationCode["userId"],
  code: EmailVerificationCode["code"],
  db: Db,
) => {
  const emailVerificatonCode = await emailVerificationRepo.selectByUserId(
    userId,
    db,
  );

  if (emailVerificatonCode?.code !== code) {
    throw new HTTPException(401, { message: "invalid code" });
  }

  await emailVerificationRepo.deleteById(emailVerificatonCode.id, db);

  const codeExpired = Date.now() >= emailVerificatonCode.expiresAt.getTime();

  if (codeExpired) {
    throw new HTTPException(401, { message: "code expired" });
  }

  await userRepo.updateEmailVerifiedAt(userId, db);
};

const deleteByUserId = async (
  userId: EmailVerificationCode["userId"],
  db: Db,
) => {
  const emailVerification = await emailVerificationRepo.deleteByUserId(
    userId,
    db,
  );

  if (!emailVerification) {
    throw new HTTPException(404, {
      message: "email verification code not found",
    });
  }

  return emailVerification;
};

export const emailVerificationService = {
  create,
  verifyCode,
  deleteByUserId,
};
