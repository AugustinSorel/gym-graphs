import { Database } from "#/integrations/db/db";
import { verificationCodes } from "#/integrations/db/schema";
import type { PgInsertValue } from "drizzle-orm/pg-core";
import { Effect, Array, pipe } from "effect";

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
      };
    }),
  },
) {}
