import { passwordResetRepo } from "~/domains/password-reset/password-reset.repo";
import { generatePasswordResetToken } from "~/domains/password-reset/password-reset.utils";
import { HTTPException } from "hono/http-exception";
import { generateSalt, hashSecret, hashSHA256Hex } from "~/libs/crypto";
import { passwordResetEmailBody } from "~/domains/password-reset/password-reset.email";
import { userRepo } from "~/domains/user/user.repo";
import { sendEmail } from "~/libs/email";
import { sessionRepo } from "~/domains/session/session.repo";
import { generateSessionToken } from "~/domains/session/session.utils";
import type { User } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { Email } from "~/libs/email";
import type { PasswordResetResetSchema } from "@gym-graphs/schemas/password-reset";

const create = async (input: Pick<User, "email">, db: Db, email: Email) => {
  await db.transaction(async (tx) => {
    const user = await userRepo.selectByEmail(input.email, tx);

    if (!user) {
      throw new HTTPException(404, { message: "user not found" });
    }

    await passwordResetRepo.deleteByUserId(user.id, tx);

    const token = generatePasswordResetToken();
    const tokenHash = hashSHA256Hex(token);

    const passwordReset = await passwordResetRepo.create(
      tokenHash,
      user.id,
      db,
    );

    await sendEmail(
      [user.email],
      "Reset your password",
      passwordResetEmailBody(passwordReset.token),
      email,
    );
  });
};

const confirm = async (input: PasswordResetResetSchema, db: Db) => {
  return db.transaction(async (tx) => {
    const tokenHash = hashSHA256Hex(input.token);

    const passwordReset = await passwordResetRepo.selectByToken(tokenHash, tx);

    if (!passwordReset) {
      throw new HTTPException(404, { message: "token not found" });
    }

    await passwordResetRepo.deleteByToken(passwordReset.token, tx);

    const codeExpired = Date.now() >= passwordReset.expiresAt.getTime();

    if (codeExpired) {
      throw new HTTPException(401, { message: "token expired" });
    }

    await sessionRepo.deleteByUserId(passwordReset.userId, tx);

    const salt = generateSalt();
    const passwordHash = await hashSecret(input.password, salt);

    await userRepo.updatePasswordAndSalt(
      passwordHash,
      salt,
      passwordReset.userId,
      tx,
    );

    const token = generateSessionToken();
    const session = await sessionRepo.create(token, passwordReset.userId, tx);

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
