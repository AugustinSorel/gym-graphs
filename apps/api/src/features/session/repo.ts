import { DatabaseOrTransaction } from "#/integrations/db/db";
import { sessions } from "#/integrations/db/schema";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array, pipe } from "effect";

export class SessionRepo extends Effect.Service<SessionRepo>()("SessionRepo", {
  accessors: true,
  effect: Effect.gen(function* () {
    return {
      create: (input: PgInsertValue<typeof sessions>) => {
        return Effect.gen(function* () {
          const db = yield* DatabaseOrTransaction;

          const rows = yield* db.insert(sessions).values(input).returning();

          const session = yield* pipe(Array.head(rows), Effect.orDie);

          return session;
        });
      },
    };
  }),
}) {}
