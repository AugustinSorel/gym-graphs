import { Database, isUniqueViolation } from "#/integrations/db/db";
import { users, type User } from "#/integrations/db/schema";
import type { PgInsertValue, PgUpdateSetSource } from "drizzle-orm/pg-core";
import { Effect, Array, pipe, Option } from "effect";
import { DuplicateUser } from "@gym-graphs/shared/user/errors";
import { eq } from "drizzle-orm";

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

      createWithEmail: (
        input: Pick<PgInsertValue<typeof users>, "email" | "name">,
      ) => {
        return Effect.gen(function* () {
          const rows = yield* db
            .insert(users)
            .values({
              ...input,
              verifiedAt: new Date(),
            })
            .returning();

          const user = yield* pipe(Array.head(rows), Effect.orDie);

          return user;
        });
      },

      //FIX: rename this to select
      findByEmail: (email: User["email"]) => {
        return Effect.gen(function* () {
          const user = yield* db.query.users.findFirst({ where: { email } });

          return Option.fromNullable(user);
        });
      },

      updateVerifiedAtById: (id: User["id"]) => {
        return Effect.gen(function* () {
          const rows = yield* db
            .update(users)
            .set({ verifiedAt: new Date() })
            .where(eq(users.id, id))
            .returning();

          const user = yield* pipe(Array.head(rows), Effect.orDie);

          return user;
        });
      },

      updatePasswordAndSalt: (
        password: NonNullable<User["password"]>,
        salt: NonNullable<User["salt"]>,
        userId: User["id"],
      ) => {
        return Effect.gen(function* () {
          return yield* db
            .update(users)
            .set({ password, salt })
            .where(eq(users.id, userId));
        });
      },

      patchByUserId: (
        input: PgUpdateSetSource<typeof users>,
        userId: User["id"],
      ) => {
        return Effect.gen(function* () {
          const rows = yield* db
            .update(users)
            .set(input)
            .where(eq(users.id, userId))
            .returning();

          const user = yield* pipe(Array.head(rows), Effect.orDie);

          return user;
        });
      },

      deleteByUserId: (userId: User["id"]) => {
        return Effect.gen(function* () {
          const rows = yield* db
            .delete(users)
            .where(eq(users.id, userId))
            .returning();

          const user = yield* pipe(Array.head(rows), Effect.orDie);

          return user;
        });
      },
    };
  }),
}) {}
