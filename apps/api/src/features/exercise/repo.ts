import { Database } from "#/integrations/db/db";
import { exercises } from "#/integrations/db/schema";
import { Effect, Array } from "effect";

export class ExerciseRepo extends Effect.Service<ExerciseRepo>()(
  "ExerciseRepo",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const db = yield* Database;

      return {
        create: () => {
          return db
            .insert(exercises)
            .values({})
            .returning()
            .pipe(
              Effect.andThen((rows) => Array.head(rows).pipe(Effect.orDie)),
            );
        },
      };
    }),
  },
) {}
