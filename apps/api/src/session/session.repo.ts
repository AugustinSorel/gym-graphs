import { sessionTable } from "~/db/db.schemas";
import { hashSHA256Hex } from "~/session/session.utils";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { thirtyDaysInMs } from "~/utils/dates";
import type { Session, User } from "~/db/db.schemas";
import type { SessionToken } from "~/session/session.utils";
import type { Db } from "~/libs/db";

const create = async (
  sessionToken: SessionToken,
  userId: User["id"],
  db: Db,
) => {
  const sessionId = hashSHA256Hex(sessionToken);

  const [session] = await db
    .insert(sessionTable)
    .values({ id: sessionId, userId })
    .returning();

  if (!session) {
    throw new HTTPException(404, { message: "session not found" });
  }

  return session;
};

const remove = async (sessionId: Session["id"], db: Db) => {
  const [session] = await db
    .delete(sessionTable)
    .where(eq(sessionTable.id, sessionId))
    .returning();

  if (!session) {
    throw new HTTPException(404, { message: "session not found" });
  }

  return session;
};

const selectById = async (sessionId: Session["id"], db: Db) => {
  return db.query.sessionTable.findFirst({
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
  });
};

const refreshExpiryDate = async (sessionId: Session["id"], db: Db) => {
  const [session] = await db
    .update(sessionTable)
    .set({ expiresAt: new Date(Date.now() + thirtyDaysInMs) })
    .where(eq(sessionTable.id, sessionId))
    .returning();

  if (!session) {
    throw new HTTPException(404, { message: "session not found" });
  }

  return session;
};

export const sessionRepo = {
  create,
  remove,
  selectById,
  refreshExpiryDate,
};
