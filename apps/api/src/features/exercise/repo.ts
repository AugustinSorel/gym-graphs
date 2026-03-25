import { Database } from "#/integrations/db/db";
import {
  exercises,
  type DashboardTile,
  type Exercise,
} from "#/integrations/db/schema";
import { ExerciseNotFound } from "@gym-graphs/shared/exercise/errors";
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

        createMany: (input: Array<typeof exercises.$inferInsert>) => {
          return db.insert(exercises).values(input).returning();
        },

        selectByExerciseId: (
          exerciseId: Exercise["id"],
          userId: DashboardTile["userId"],
        ) => {
          return Effect.gen(function* () {
            const exercise = yield* db.query.exercises.findFirst({
              where: {
                id: exerciseId,
                dashboardTile: {
                  userId,
                },
              },
              with: {
                dashboardTile: true,
              },
            });

            if (!exercise) {
              return yield* Effect.fail(new ExerciseNotFound());
            }

            return yield* Effect.succeed(exercise);
          });
        },
      };
    }),
  },
) {}
