import { sessionTable } from "~/db/db.schemas";
import { hashSHA256Hex } from "~/session/session.utils";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import type { Session, User } from "~/db/db.schemas";
import type { SessionToken } from "~/session/session.utils";
import type { Db } from "~/libs/db";
import { thirtyDaysInMs } from "~/utils/dates";

export const createSessionRepo = (db: Db) => {
  return {
    create: async (sessionToken: SessionToken, userId: User["id"]) => {
      const sessionId = hashSHA256Hex(sessionToken);

      const [session] = await db
        .insert(sessionTable)
        .values({ id: sessionId, userId })
        .returning();

      if (!session) {
        throw new HTTPException(404, { message: "session not found" });
      }

      return session;
    },

    delete: async (sessionId: Session["id"]) => {
      const [session] = await db
        .delete(sessionTable)
        .where(eq(sessionTable.id, sessionId))
        .returning();

      if (!session) {
        throw new HTTPException(404, { message: "session not found" });
      }

      return session;
    },

    selectById: async (sessionId: Session["id"]) => {
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
    },

    refreshExpiryDate: async (sessionId: Session["id"]) => {
      const [session] = await db
        .update(sessionTable)
        .set({ expiresAt: new Date(Date.now() + thirtyDaysInMs) })
        .where(eq(sessionTable.id, sessionId))
        .returning();

      if (!session) {
        throw new HTTPException(404, { message: "session not found" });
      }

      return session;
    },
  };
};
