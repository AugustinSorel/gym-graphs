import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { passwordResetTokenTable } from "~/db/db.schemas";
import type { PasswordResetToken } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const deleteByUserId = async (userId: PasswordResetToken["userId"], db: Db) => {
  const [passwordReset] = await db
    .delete(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.userId, userId))
    .returning();

  if (!passwordReset) {
    throw new HTTPException(404, { message: "password reset not found" });
  }

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

  if (!passwordResetToken) {
    throw new HTTPException(404, { message: "password reset not found" });
  }

  return passwordResetToken;
};

export const passwordResetRepo = {
  deleteByUserId,
  create,
};
