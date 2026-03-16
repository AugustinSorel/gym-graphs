import { Database } from "#/integrations/db/db";
import {
  verificationCodes,
  type VerificationCode,
} from "#/integrations/db/schema";
import { eq } from "drizzle-orm";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array, pipe, Option } from "effect";

export class VerificationCodeRepo extends Effect.Service<VerificationCodeRepo>()(
  "VerificationCodeRepo",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const db = yield* Database;

      return {
        create: (input: PgInsertValue<typeof verificationCodes>) => {
          return Effect.gen(function* () {
            const rows = yield* db
              .insert(verificationCodes)
              .values(input)
              .returning();

            const user = yield* pipe(Array.head(rows), Effect.orDie);

            return user;
          });
        },

        selectByUserId: (userId: VerificationCode["userId"]) => {
          return Effect.gen(function* () {
            const session = yield* db.query.verificationCodes.findFirst({
              where: {
                userId,
              },
              with: {
                user: {
                  columns: {
                    email: true,
                  },
                },
              },
            });

            return Option.fromNullable(session);
          });
        },

        deleteById: (id: VerificationCode["id"]) => {
          return Effect.gen(function* () {
            return yield* db
              .delete(verificationCodes)
              .where(eq(verificationCodes.id, id))
              .returning();
          });
        },
      };
    }),
  },
) {}
