import { eq } from "drizzle-orm";
import { emailVerificationCodeTable } from "~/db/db.schemas";
import type { EmailVerificationCode } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (
  code: EmailVerificationCode["code"],
  userId: EmailVerificationCode["userId"],
  db: Db,
) => {
  return db
    .insert(emailVerificationCodeTable)
    .values({ userId, code })
    .returning();
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

const remove = async (id: EmailVerificationCode["id"], db: Db) => {
  return db
    .delete(emailVerificationCodeTable)
    .where(eq(emailVerificationCodeTable.id, id))
    .returning();
};

export const emailVerificationRepo = {
  create,
  selectByUserId,
  remove,
};
