import { generateEmailVerificationCode } from "~/email-verification/email-verification.utils";
import { emailVerificationRepo } from "~/email-verification/email-verification.repo";
import { userRepo } from "~/user/user.repo";
import { HTTPException } from "hono/http-exception";
import { emailVerificationEmailBody } from "./email-verification.emails";
import { sessionRepo } from "~/session/session.repo";
import { generateSessionToken } from "~/session/session.utils";
import type { Db } from "~/libs/db";
import type { EmailVerificationCode, User } from "~/db/db.schemas";
import type { Email } from "~/libs/email";

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

const create = async (
  user: Pick<User, "id" | "email">,
  db: Db,
  email: Email,
) => {
  await db.transaction(async (tx) => {
    await emailVerificationRepo.deleteByUserId(user.id, tx);

    const emailVerificationCode = generateEmailVerificationCode();

    const emailVerification = await emailVerificationRepo.create(
      emailVerificationCode,
      user.id,
      tx,
    );

    if (!emailVerification) {
      throw new HTTPException(404, {
        message: "email verification code not found",
      });
    }

    const config = email.buildConfig(
      [user.email],
      "Verification code",
      emailVerificationEmailBody(emailVerification.code),
    );

    await email.client.send(config);
  });
};

const confirm = async (
  userId: EmailVerificationCode["userId"],
  code: EmailVerificationCode["code"],
  db: Db,
) => {
  return db.transaction(async (tx) => {
    await emailVerificationService.verifyCode(userId, code, tx);

    await sessionRepo.deleteByUserId(userId, tx);

    const token = generateSessionToken();

    const session = await sessionRepo.create(token, userId, tx);

    if (!session) {
      throw new HTTPException(404, { message: "session not found" });
    }

    return {
      session,
      token,
    };
  });
};

export const emailVerificationService = {
  create,
  confirm,
  verifyCode,
};
