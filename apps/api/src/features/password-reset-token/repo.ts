import { Database } from "#/integrations/db/db";
import {
  passwordResetTokens,
  type PasswordResetToken,
} from "#/integrations/db/schema";
import { eq } from "drizzle-orm";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array, Option } from "effect";

export class PasswordResetTokenRepo extends Effect.Service<PasswordResetTokenRepo>()(
  "PasswordResetTokenRepo",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      return {
        deleteByUserId: (userId: PasswordResetToken["userId"]) => {
          return Effect.gen(function* () {
            const db = yield* Database;

            yield* db
              .delete(passwordResetTokens)
              .where(eq(passwordResetTokens.userId, userId))
              .returning();
          });
        },

        deleteByToken: (token: PasswordResetToken["token"]) => {
          return Effect.gen(function* () {
            const db = yield* Database;

            yield* db
              .delete(passwordResetTokens)
              .where(eq(passwordResetTokens.token, token))
              .returning();
          });
        },

        create: (input: PgInsertValue<typeof passwordResetTokens>) => {
          return Effect.gen(function* () {
            const db = yield* Database;

            const rows = yield* db
              .insert(passwordResetTokens)
              .values(input)
              .returning();

            return yield* Array.head(rows).pipe(Effect.orDie);
          });
        },

        selectByToken: (token: PasswordResetToken["token"]) => {
          return Effect.gen(function* () {
            const db = yield* Database;

            return yield* db.query.passwordResetTokens
              .findFirst({
                where: {
                  token,
                },
              })
              .pipe(Effect.map(Option.fromNullable));
          });
        },
      };
    }),
  },
) {}
