import { Database } from "#/integrations/db/db";
import { users } from "#/integrations/db/schema";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array, pipe, Schema } from "effect";
import { DuplicateUser } from "./errors";
import { DatabaseError } from "pg";

const DatabaseErrorSchema = Schema.Struct({
  cause: Schema.Struct({
    error: Schema.Struct({
      cause: Schema.instanceOf(DatabaseError),
    }),
  }),
});

const isUniqueViolation = (e: unknown, constraint: string): boolean => {
  if (!Schema.is(DatabaseErrorSchema)(e)) {
    return false;
  }

  const dbError = e.cause.error.cause;

  return dbError.code === "23505" && dbError.constraint === constraint;
};

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

      findByEmail: (email: string) => {
        return db.query.users
          .findFirst({ where: { email } })
          .pipe(Effect.andThen(Effect.fromNullable));
      },
    };
  }),
}) {}
