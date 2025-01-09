import type { Db } from "~/utils/db";
import { Session, sessionTable, User } from "~/db/db.schemas";
import { sha256Encode } from "../auth/auth.services";
import { eq } from "drizzle-orm";
import { thirtyDaysInMs } from "~/utils/date.utils";

export const createSession = async (
  sessionToken: string,
  userId: User["id"],
  db: Db,
) => {
  const sessionId = await sha256Encode(sessionToken);

  const [session] = await db
    .insert(sessionTable)
    .values({ id: sessionId, userId })
    .returning();

  if (!session) {
    throw new Error("session returned by db is null");
  }

  return session;
};

export const deleteSession = async (sessionId: Session["id"], db: Db) => {
  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
};

export const refreshSessionExpiryDate = async (
  sessionId: Session["id"],
  db: Db,
) => {
  await db
    .update(sessionTable)
    .set({
      expiresAt: new Date(Date.now() + thirtyDaysInMs),
      updatedAt: new Date(),
    })
    .where(eq(sessionTable.id, sessionId));
};

export const selectSessionWithUser = async (
  sessionId: Session["id"],
  db: Db,
) => {
  return db.query.sessionTable.findFirst({
    where: eq(sessionTable.id, sessionId),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          weightUnit: true,
          name: true,
        },
      },
    },
  });
};
