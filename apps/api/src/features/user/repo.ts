import { CurrentDb } from "#/integrations/db/db";
import { users } from "#/integrations/db/schema";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Cause, Effect } from "effect";

export class UserRepo extends Effect.Service<UserRepo>()("UserRepo", {
  accessors: true,
  effect: Effect.gen(function* () {
    return {
      createWithEmailAndPassword: (input: PgInsertValue<typeof users>) => {
        return Effect.gen(function* () {
          const db = yield* CurrentDb;

          const rows = yield* db.insert(users).values(input).returning();

          const user = rows.at(0);

          if (!user) {
            return yield* new Cause.NoSuchElementException();
          }

          return user;
        });
      },
    };
  }),
}) {}
