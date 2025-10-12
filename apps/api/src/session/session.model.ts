import { sessionTable } from "~/db/db.schemas";
import { hashSHA256Hex } from "~/session/session.utils";
import { SessionNotFoundError } from "~/session/session.errors";
import type { User } from "~/db/db.schemas";
import type { SessionToken } from "~/session/session.utils";
import type { Db } from "~/libs/db";

export const createSessionModel = (db: Db) => {
  return {
    create: async (sessionToken: SessionToken, userId: User["id"]) => {
      const sessionId = hashSHA256Hex(sessionToken);

      const [session] = await db
        .insert(sessionTable)
        .values({ id: sessionId, userId })
        .returning();

      if (!session) {
        throw new SessionNotFoundError();
      }

      return session;
    },
  };
};
