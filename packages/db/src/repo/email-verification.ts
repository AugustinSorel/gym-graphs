import { eq } from "drizzle-orm";
import { emailVerificationCodeTable } from "~/schemas";
import { err, ok, ResultAsync } from "neverthrow";
import { buildError } from "~/error";
import { extractEntityFromRows } from "~/utils";
import type { EmailVerificationCode } from "~/schemas";
import type { Db } from "~/db";

const create = (
  code: EmailVerificationCode["code"],
  userId: EmailVerificationCode["userId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.insert(emailVerificationCodeTable).values({ userId, code }).returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const selectByUserId = (userId: EmailVerificationCode["userId"], db: Db) => {
  return ResultAsync.fromPromise(
    db.query.emailVerificationCodeTable.findFirst({
      where: eq(emailVerificationCodeTable.userId, userId),
      with: {
        user: {
          columns: {
            email: true,
          },
        },
      },
    }),
    (e) => buildError("internal", e),
  ).andThen((verificationCode) => {
    if (!verificationCode) {
      return err(buildError("email verification code not found"));
    }

    return ok(verificationCode);
  });
};

const deleteById = (id: EmailVerificationCode["id"], db: Db) => {
  return ResultAsync.fromPromise(
    db
      .delete(emailVerificationCodeTable)
      .where(eq(emailVerificationCodeTable.id, id))
      .returning(),

    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const deleteByUserId = (userId: EmailVerificationCode["userId"], db: Db) => {
  return ResultAsync.fromPromise(
    db
      .delete(emailVerificationCodeTable)
      .where(eq(emailVerificationCodeTable.userId, userId))
      .returning(),

    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

export const emailVerificationRepo = {
  create,
  selectByUserId,
  deleteById,
  deleteByUserId,
};
