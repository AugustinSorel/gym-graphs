import { passwordResetRepo } from "~/password-reset/password-reset.repo";
import { generatePasswordResetToken } from "~/password-reset/password-reset.utils";
import { hashSHA256Hex } from "~/session/session.utils";
import type { PasswordResetToken } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (userId: PasswordResetToken["userId"], db: Db) => {
  const token = generatePasswordResetToken();
  const tokenHash = hashSHA256Hex(token);

  return await passwordResetRepo.create(tokenHash, userId, db);
};

const refresh = async (userId: PasswordResetToken["userId"], db: Db) => {
  await passwordResetRepo.deleteByUserId(userId, db);

  return create(userId, db);
};

export const passwordResetService = {
  create,
  refresh,
};
