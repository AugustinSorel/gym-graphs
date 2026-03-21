import { Database } from "#/integrations/db/db";
import { sessions, type Session } from "#/integrations/db/schema";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array, pipe, Clock, Duration, Option } from "effect";
import { eq } from "drizzle-orm";

export class SessionRepo extends Effect.Service<SessionRepo>()("SessionRepo", {
  accessors: true,
  effect: Effect.gen(function* () {
    const db = yield* Database;

    return {
      create: (input: PgInsertValue<typeof sessions>) => {
        return Effect.gen(function* () {
          const rows = yield* db.insert(sessions).values(input).returning();

          const session = yield* pipe(Array.head(rows), Effect.orDie);

          return session;
        });
      },

      selectById: (sessionId: Session["id"]) => {
        return Effect.gen(function* () {
          const session = yield* db.query.sessions.findFirst({
            where: {
              id: sessionId,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  verifiedAt: true,
                  email: true,
                  name: true,
                  weightUnit: true,
                  dashboardView: true,
                  oneRepMaxAlgo: true,
                },
              },
            },
          });

          return Option.fromNullable(session);
        });
      },

      refreshExpiryDateBySessionId: (sessionId: Session["id"]) => {
        return Effect.gen(function* () {
          const now = yield* Clock.currentTimeMillis;

          const rows = yield* db
            .update(sessions)
            .set({ expiresAt: new Date(now + Duration.toMillis("30 days")) })
            .where(eq(sessions.id, sessionId))
            .returning();

          const session = yield* pipe(Array.head(rows), Effect.orDie);

          return session;
        });
      },

      deleteById: (sessionId: Session["id"]) => {
        return Effect.gen(function* () {
          yield* db.delete(sessions).where(eq(sessions.id, sessionId));
        });
      },

      deleteByUserId: (userId: Session["userId"]) => {
        return Effect.gen(function* () {
          yield* db.delete(sessions).where(eq(sessions.userId, userId));
        });
      },
    };
  }),
}) {}
