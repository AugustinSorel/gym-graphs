import { generateEmailVerificationCode } from "~/domains/email-verification/email-verification.utils";
import { emailVerificationRepo } from "@gym-graphs/db/repo/email-verification";
import { userRepo } from "@gym-graphs/db/repo/user";
import { HTTPException } from "hono/http-exception";
import { emailVerificationEmailBody } from "~/domains/email-verification/email-verification.emails";
import { sessionRepo } from "@gym-graphs/db/repo/session";
import { generateSessionToken } from "~/domains/session/session.utils";
import { sendEmail } from "~/libs/email";
import { dbErrorToHttp } from "~/libs/db";
import type { Db } from "@gym-graphs/db";
import type { EmailVerificationCode, User } from "@gym-graphs/db/schemas";
import type { Email } from "~/libs/email";
import { err, ok } from "neverthrow";

const create = async (
  user: Pick<User, "id" | "email">,
  db: Db,
  email: Email,
) => {
  await db.transaction(async (tx) => {
    await emailVerificationRepo.deleteByUserId(user.id, tx);

    const emailVerificationCode = generateEmailVerificationCode();

    const emailVerification = await emailVerificationRepo
      .create(emailVerificationCode, user.id, tx)
      .match((verificationCode) => verificationCode, dbErrorToHttp);

    await sendEmail(
      [user.email],
      "Verification code",
      emailVerificationEmailBody(emailVerification.code),
      email,
    );
  });
};

const confirm = async (
  userId: EmailVerificationCode["userId"],
  code: EmailVerificationCode["code"],
  db: Db,
) => {
  return db.transaction(async (tx) => {
    const emailVerificatonCode = await emailVerificationRepo
      .selectByUserId(userId, db)
      .orElse((e) => {
        if (e.type === "email verification code not found") {
          return ok(null);
        }
        return err(e);
      })
      .match((verificationCode) => verificationCode, dbErrorToHttp);

    if (emailVerificatonCode?.code !== code) {
      throw new HTTPException(401, { message: "invalid code" });
    }

    await emailVerificationRepo
      .deleteById(emailVerificatonCode.id, db)
      .match((code) => code, dbErrorToHttp);

    const codeExpired = Date.now() >= emailVerificatonCode.expiresAt.getTime();

    if (codeExpired) {
      throw new HTTPException(401, { message: "code expired" });
    }

    await userRepo
      .updateEmailVerifiedAt(userId, db)
      .match((user) => user, dbErrorToHttp);

    await sessionRepo
      .deleteByUserId(userId, tx)
      .match((session) => session, dbErrorToHttp);

    const token = generateSessionToken();

    const session = await sessionRepo
      .create(token, userId, tx)
      .match((session) => session, dbErrorToHttp);

    return {
      session,
      token,
    };
  });
};

export const emailVerificationService = {
  create,
  confirm,
};
