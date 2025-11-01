import { generateSalt, hashSecret } from "~/libs/crypto";
import { sendEmail } from "~/libs/email";
import { inferNameFromEmail } from "~/domains/user/user.utils";
import { userRepo } from "@gym-graphs/db/repo/user";
import { seedUserAccount } from "~/domains/user/user.seed";
import { generateEmailVerificationCode } from "~/domains/email-verification/email-verification.utils";
import { emailVerificationRepo } from "@gym-graphs/db/repo/email-verification";
import { emailVerificationEmailBody } from "~/domains/email-verification/email-verification.emails";
import { generateSessionToken } from "~/domains/session/session.utils";
import { sessionRepo } from "@gym-graphs/db/repo/session";
import { dbErrorToHttp } from "~/libs/db";
import type { SignUpSchema } from "@gym-graphs/schemas/session";
import type { Db } from "@gym-graphs/db";
import type { Email } from "~/libs/email";
import type { User } from "@gym-graphs/db/schemas";

const signUp = async (input: SignUpSchema, db: Db, email: Email) => {
  return db.transaction(async (tx) => {
    const salt = generateSalt();
    const hashedPassword = await hashSecret(input.password, salt);

    const name = inferNameFromEmail(input.email);

    const user = await userRepo
      .createWithEmailAndPassword(input.email, hashedPassword, salt, name, tx)
      .match((user) => user, dbErrorToHttp);

    await seedUserAccount(user.id, tx);

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

    const token = generateSessionToken();

    const session = await sessionRepo
      .create(token, user.id, tx)
      .match((session) => session, dbErrorToHttp);

    return {
      session,
      token,
    };
  });
};

export const selectClient = async (userId: User["id"], db: Db) => {
  return userRepo.selectClient(userId, db).match((user) => user, dbErrorToHttp);
};

const patchById = async (
  input: Parameters<typeof userRepo.patchById>[0],
  userId: User["id"],
  db: Db,
) => {
  return userRepo
    .patchById(input, userId, db)
    .match((user) => user, dbErrorToHttp);
};

const deleteById = async (userId: User["id"], db: Db) => {
  return userRepo.deleteById(userId, db).match((user) => user, dbErrorToHttp);
};

const selectDataById = async (userId: User["id"], db: Db) => {
  return userRepo
    .selectDataById(userId, db)
    .match((user) => user, dbErrorToHttp);
};

export const userService = {
  signUp,
  selectClient,
  patchById,
  deleteById,
  selectDataById,
};
