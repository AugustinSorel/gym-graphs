import { Database } from "#/integrations/db/db";
import {
  exercises,
  exercisesToTags,
  type Exercise,
  type Tag,
} from "#/integrations/db/schema";
import { ExerciseNotFound } from "@gym-graphs/shared/exercise/errors";
import { Effect, Array } from "effect";
import { eq } from "drizzle-orm";

export class ExerciseRepo extends Effect.Service<ExerciseRepo>()(
  "ExerciseRepo",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const db = yield* Database;

      return {
        create: (name: Exercise["name"], userId: Exercise["userId"]) => {
          return db
            .insert(exercises)
            .values({ name, userId })
            .returning()
            .pipe(
              Effect.andThen((rows) => Array.head(rows).pipe(Effect.orDie)),
            );
        },

        createMany: (input: Array<typeof exercises.$inferInsert>) => {
          return db.insert(exercises).values(input).returning();
        },

        deleteById: (exerciseId: Exercise["id"]) => {
          return db
            .delete(exercises)
            .where(eq(exercises.id, exerciseId))
            .returning();
        },

        selectByExerciseId: (
          exerciseId: Exercise["id"],
          userId: Exercise["userId"],
        ) => {
          return Effect.gen(function* () {
            const exercise = yield* db.query.exercises.findFirst({
              where: {
                id: exerciseId,
                userId,
              },
            });

            if (!exercise) {
              return yield* Effect.fail(new ExerciseNotFound());
            }

            return yield* Effect.succeed(exercise);
          });
        },

        addTags: (exerciseId: Exercise["id"], tagIds: Tag["id"][]) => {
          return db
            .insert(exercisesToTags)
            .values(tagIds.map((tagId) => ({ exerciseId, tagId })))
            .onConflictDoNothing()
            .returning();
        },
      };
    }),
  },
) {}
