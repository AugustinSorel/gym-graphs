import { passwordResetRepo } from "~/password-reset/password-reset.repo";
import { generatePasswordResetToken } from "~/password-reset/password-reset.utils";
import { hashSHA256Hex } from "~/session/session.utils";
import type { PasswordResetToken } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import { HTTPException } from "hono/http-exception";

const create = async (userId: PasswordResetToken["userId"], db: Db) => {
  const token = generatePasswordResetToken();
  const tokenHash = hashSHA256Hex(token);

  const passwordReset = await passwordResetRepo.create(tokenHash, userId, db);

  if (!passwordReset) {
    throw new HTTPException(404, { message: "password reset not found" });
  }

  return passwordReset;
};

const deleteByUserId = async (userId: PasswordResetToken["userId"], db: Db) => {
  const passwordReset = await passwordResetRepo.deleteByUserId(userId, db);

  if (!passwordReset) {
    throw new HTTPException(404, { message: "password reset not found" });
  }

  return passwordReset;
};

export const passwordResetService = {
  create,
  deleteByUserId,
};
