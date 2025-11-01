import { eq } from "drizzle-orm";
import { passwordResetTokenTable } from "~/schemas";
import { err, ok, ResultAsync } from "neverthrow";
import { buildError } from "~/error";
import { extractEntityFromRows } from "~/utils";
import type { PasswordResetToken } from "~/schemas";
import type { Db } from "~/db";

const deleteByUserId = (userId: PasswordResetToken["userId"], db: Db) => {
  return ResultAsync.fromPromise(
    db
      .delete(passwordResetTokenTable)
      .where(eq(passwordResetTokenTable.userId, userId))
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(() => ok(null));
};

const deleteByToken = (token: PasswordResetToken["token"], db: Db) => {
  return ResultAsync.fromPromise(
    db
      .delete(passwordResetTokenTable)
      .where(eq(passwordResetTokenTable.token, token))
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(() => ok(null));
};

const create = (
  token: PasswordResetToken["token"],
  userId: PasswordResetToken["userId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.insert(passwordResetTokenTable).values({ token, userId }).returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const selectByToken = (token: PasswordResetToken["token"], db: Db) => {
  return ResultAsync.fromPromise(
    db
      .select()
      .from(passwordResetTokenTable)
      .where(eq(passwordResetTokenTable.token, token)),
    (e) => buildError("internal", e),
  ).andThen((rows) => {
    const passwordReset = rows.at(0);

    if (!passwordReset) {
      return err(buildError("password reset not found"));
    }

    return ok(passwordReset);
  });
};

export const passwordResetRepo = {
  deleteByUserId,
  deleteByToken,
  selectByToken,
  create,
};
