import { eq } from "drizzle-orm";
import { passwordResetTokenTable } from "~/db/db.schemas";
import type { PasswordResetToken } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const deleteByUserId = async (userId: PasswordResetToken["userId"], db: Db) => {
  const [passwordReset] = await db
    .delete(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.userId, userId))
    .returning();

  return passwordReset;
};

const create = async (
  token: PasswordResetToken["token"],
  userId: PasswordResetToken["userId"],
  db: Db,
) => {
  const [passwordResetToken] = await db
    .insert(passwordResetTokenTable)
    .values({ token, userId })
    .returning();

  return passwordResetToken;
};

export const passwordResetRepo = {
  deleteByUserId,
  create,
};
