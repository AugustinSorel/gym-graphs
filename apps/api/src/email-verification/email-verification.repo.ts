import { eq } from "drizzle-orm";
import { emailVerificationCodeTable } from "~/db/db.schemas";
import type { EmailVerificationCode } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (
  code: EmailVerificationCode["code"],
  userId: EmailVerificationCode["userId"],
  db: Db,
) => {
  const [emailVerification] = await db
    .insert(emailVerificationCodeTable)
    .values({ userId, code })
    .returning();

  return emailVerification;
};

const selectByUserId = async (
  userId: EmailVerificationCode["userId"],
  db: Db,
) => {
  return db.query.emailVerificationCodeTable.findFirst({
    where: eq(emailVerificationCodeTable.userId, userId),
    with: {
      user: {
        columns: {
          email: true,
        },
      },
    },
  });
};

const deleteById = async (id: EmailVerificationCode["id"], db: Db) => {
  const [emailVerification] = await db
    .delete(emailVerificationCodeTable)
    .where(eq(emailVerificationCodeTable.id, id))
    .returning();

  return emailVerification;
};

const deleteByUserId = async (
  userId: EmailVerificationCode["userId"],
  db: Db,
) => {
  const [emailVerification] = await db
    .delete(emailVerificationCodeTable)
    .where(eq(emailVerificationCodeTable.userId, userId))
    .returning();

  return emailVerification;
};

export const emailVerificationRepo = {
  create,
  selectByUserId,
  deleteById,
  deleteByUserId,
};
