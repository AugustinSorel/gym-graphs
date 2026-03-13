import { DbClient } from "#/integrations/db/db";
import { users } from "#/integrations/db/schema";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array, pipe } from "effect";
import { DuplicateUser } from "./errors";

export class UserRepo extends Effect.Service<UserRepo>()("UserRepo", {
  accessors: true,
  effect: Effect.gen(function* () {
    return {
      createWithEmailAndPassword: (input: PgInsertValue<typeof users>) => {
        return Effect.gen(function* () {
          const db = yield* DbClient;

          const rows = yield* db
            .insert(users)
            .values(input)
            .returning()
            .pipe(
              Effect.catchIf(
                (e) => {
                  return (
                    e.cause.error.cause.code === "23505" &&
                    e.cause.error.cause.constraint === "users_email_key"
                  );
                },
                () => DuplicateUser.withEmail(input.email.toString()),
              ),
            );

          const user = yield* pipe(Array.head(rows), Effect.orDie);

          return user;
        });
      },
    };
  }),
}) {}
