import { Database } from "#/integrations/db/db";
import { oauthAccounts } from "#/integrations/db/schema";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array, pipe } from "effect";

export class OAuthRepo extends Effect.Service<OAuthRepo>()("OAuthRepo", {
  accessors: true,
  effect: Effect.gen(function* () {
    const db = yield* Database;

    return {
      create: (input: PgInsertValue<typeof oauthAccounts>) => {
        return Effect.gen(function* () {
          const rows = yield* db
            .insert(oauthAccounts)
            .values(input)
            .returning();

          return yield* pipe(Array.head(rows), Effect.orDie);
        });
      },
    };
  }),
}) {}
