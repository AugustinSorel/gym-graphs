import { Database, isUniqueViolation } from "#/integrations/db/db";
import { users, type User } from "#/integrations/db/schema";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array, pipe } from "effect";
import { DuplicateUser } from "./errors";

export class UserRepo extends Effect.Service<UserRepo>()("UserRepo", {
  accessors: true,
  effect: Effect.gen(function* () {
    const db = yield* Database;

    return {
      createWithEmailAndPassword: (input: PgInsertValue<typeof users>) => {
        return Effect.gen(function* () {
          const rows = yield* db
            .insert(users)
            .values(input)
            .returning()
            .pipe(
              Effect.catchIf(
                (e) => isUniqueViolation(e, "users_email_key"),
                () => DuplicateUser.withEmail(input.email.toString()),
              ),
            );

          const user = yield* pipe(Array.head(rows), Effect.orDie);

          return user;
        });
      },

      findByEmail: (email: User["email"]) => {
        return db.query.users
          .findFirst({ where: { email } })
          .pipe(Effect.andThen(Effect.fromNullable));
      },
    };
  }),
}) {}
