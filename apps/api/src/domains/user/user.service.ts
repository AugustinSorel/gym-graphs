import { generateSalt, hashSecret } from "~/libs/crypto";
import { sendEmail } from "~/libs/email";
import { inferNameFromEmail } from "~/domains/user/user.utils";
import { userRepo } from "~/domains/user/user.repo";
import { seedUserAccount } from "~/domains/user/user.seed";
import { generateEmailVerificationCode } from "~/domains/email-verification/email-verification.utils";
import { emailVerificationRepo } from "~/domains/email-verification/email-verification.repo";
import { emailVerificationEmailBody } from "~/domains/email-verification/email-verification.emails";
import { generateSessionToken } from "~/domains/session/session.utils";
import { sessionRepo } from "~/domains/session/session.repo";
import { HTTPException } from "hono/http-exception";
import type { SignUpSchema } from "@gym-graphs/schemas/session";
import type { Db } from "~/libs/db";
import type { Email } from "~/libs/email";
import type { User } from "~/db/db.schemas";

const signUp = async (input: SignUpSchema, db: Db, email: Email) => {
  return db.transaction(async (tx) => {
    const salt = generateSalt();
    const hashedPassword = await hashSecret(input.password, salt);

    const name = inferNameFromEmail(input.email);

    const user = await userRepo.createWithEmailAndPassword(
      input.email,
      hashedPassword,
      salt,
      name,
      tx,
    );

    await seedUserAccount(user.id);

    const emailVerificationCode = generateEmailVerificationCode();

    const emailVerification = await emailVerificationRepo.create(
      emailVerificationCode,
      user.id,
      tx,
    );

    await sendEmail(
      [user.email],
      "Verification code",
      emailVerificationEmailBody(emailVerification.code),
      email,
    );

    const token = generateSessionToken();

    const session = await sessionRepo.create(token, user.id, tx);

    return {
      session,
      token,
    };
  });
};

export const selectClient = async (userId: User["id"], db: Db) => {
  const user = await userRepo.selectClient(userId, db);

  if (!user) {
    throw new HTTPException(404, { message: "user not found" });
  }

  return user;
};

export const userService = {
  signUp,
  selectClient,
};
