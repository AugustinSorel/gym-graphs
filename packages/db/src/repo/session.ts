import { sessionTable } from "~/schemas";
import { eq } from "drizzle-orm";
import { thirtyDaysInMs, hashSHA256Hex, extractEntityFromRows } from "~/utils";
import { err, ok, ResultAsync } from "neverthrow";
import { buildError } from "~/error";
import type { Session } from "~/schemas";
import type { Db } from "~/db";

const create = (sessionToken: string, userId: Session["userId"], db: Db) => {
  const sessionId = hashSHA256Hex(sessionToken);

  return ResultAsync.fromPromise(
    db.insert(sessionTable).values({ id: sessionId, userId }).returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const deleteById = (sessionId: Session["id"], db: Db) => {
  return ResultAsync.fromPromise(
    db.delete(sessionTable).where(eq(sessionTable.id, sessionId)).returning(),
    (e) => buildError("internal", e),
  ).andThen(() => ok(null));
};

const deleteByUserId = (userId: Session["userId"], db: Db) => {
  return ResultAsync.fromPromise(
    db.delete(sessionTable).where(eq(sessionTable.userId, userId)).returning(),
    (e) => buildError("internal", e),
  ).andThen(() => ok(null));
};

const selectById = (sessionId: Session["id"], db: Db) => {
  return ResultAsync.fromPromise(
    db.query.sessionTable.findFirst({
      where: eq(sessionTable.id, sessionId),
      with: {
        user: {
          with: {
            dashboard: {
              columns: {
                id: true,
              },
            },
          },
          columns: {
            id: true,
            emailVerifiedAt: true,
            email: true,
            name: true,
            oneRepMaxAlgo: true,
          },
        },
      },
    }),
    (e) => buildError("internal", e),
  ).andThen((session) => {
    if (!session) {
      return err(buildError("session not found"));
    }

    return ok(session);
  });
};

const refreshExpiryDate = (sessionId: Session["id"], db: Db) => {
  return ResultAsync.fromPromise(
    db
      .update(sessionTable)
      .set({ expiresAt: new Date(Date.now() + thirtyDaysInMs) })
      .where(eq(sessionTable.id, sessionId))
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

export const sessionRepo = {
  create,
  deleteById,
  deleteByUserId,
  selectById,
  refreshExpiryDate,
};
