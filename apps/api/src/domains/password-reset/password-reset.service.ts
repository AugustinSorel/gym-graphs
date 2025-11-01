import { passwordResetRepo } from "@gym-graphs/db/repo/password-reset";
import { generatePasswordResetToken } from "~/domains/password-reset/password-reset.utils";
import { HTTPException } from "hono/http-exception";
import { generateSalt, hashSecret, hashSHA256Hex } from "~/libs/crypto";
import { passwordResetEmailBody } from "~/domains/password-reset/password-reset.email";
import { userRepo } from "@gym-graphs/db/repo/user";
import { sendEmail } from "~/libs/email";
import { sessionRepo } from "@gym-graphs/db/repo/session";
import { generateSessionToken } from "~/domains/session/session.utils";
import { dbErrorToHttp } from "~/libs/db";
import type { User } from "@gym-graphs/db/schemas";
import type { Db } from "@gym-graphs/db";
import type { Email } from "~/libs/email";
import type { PasswordResetResetSchema } from "@gym-graphs/schemas/password-reset";

const create = async (input: Pick<User, "email">, db: Db, email: Email) => {
  await db.transaction(async (tx) => {
    const user = await userRepo
      .selectByEmail(input.email, tx)
      .match((user) => user, dbErrorToHttp);

    await passwordResetRepo
      .deleteByUserId(user.id, tx)
      .match((passwordReset) => passwordReset, dbErrorToHttp);

    const token = generatePasswordResetToken();
    const tokenHash = hashSHA256Hex(token);

    await passwordResetRepo
      .create(tokenHash, user.id, db)
      .match((passwordReset) => passwordReset, dbErrorToHttp);

    await sendEmail(
      [user.email],
      "Reset your password",
      passwordResetEmailBody(token),
      email,
    );
  });
};

const confirm = async (input: PasswordResetResetSchema, db: Db) => {
  return db.transaction(async (tx) => {
    const tokenHash = hashSHA256Hex(input.token);

    const passwordReset = await passwordResetRepo
      .selectByToken(tokenHash, tx)
      .match((passwordReset) => passwordReset, dbErrorToHttp);

    await passwordResetRepo
      .deleteByToken(passwordReset.token, tx)
      .match((passwordReset) => passwordReset, dbErrorToHttp);

    const codeExpired = Date.now() >= passwordReset.expiresAt.getTime();

    if (codeExpired) {
      throw new HTTPException(401, { message: "token expired" });
    }

    await sessionRepo
      .deleteByUserId(passwordReset.userId, tx)
      .match((passwordReset) => passwordReset, dbErrorToHttp);

    const salt = generateSalt();
    const passwordHash = await hashSecret(input.password, salt);

    await userRepo
      .updatePasswordAndSalt(passwordHash, salt, passwordReset.userId, tx)
      .match((user) => user, dbErrorToHttp);

    const token = generateSessionToken();

    const session = await sessionRepo
      .create(token, passwordReset.userId, tx)
      .match((session) => session, dbErrorToHttp);

    return {
      session,
      token,
    };
  });
};

export const passwordResetService = {
  create,
  confirm,
};
