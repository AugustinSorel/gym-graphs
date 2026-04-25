import { Array, Effect } from "effect";
import { ExerciseRepo } from "./repo";
import type { Exercise, User } from "#/integrations/db/schema";
import type {
  CreateExercisePayload,
  ReorderExercisesPayload,
  SelectAllExercisesUrlParams,
} from "@gym-graphs/shared/exercise/schemas";
import { withTransaction } from "#/integrations/db/db";

export class ExerciseService extends Effect.Service<ExerciseService>()(
  "ExerciseService",
  {
    accessors: true,
    dependencies: [ExerciseRepo.Default],
    effect: Effect.gen(function* () {
      const exerciseRepo = yield* ExerciseRepo;

      return {
        selectByExerciseId: (
          exerciseId: Exercise["id"],
          userId: User["id"],
        ) => {
          return exerciseRepo
            .selectByExerciseId(exerciseId, userId)
            .pipe(Effect.timeout(5000));
        },

        create: (
          payload: typeof CreateExercisePayload.Type,
          userId: Exercise["userId"],
        ) => {
          return withTransaction(
            Effect.gen(function* () {
              const exercise = yield* exerciseRepo.create(payload.name, userId);

              if (Array.isNonEmptyReadonlyArray(payload.tagIds)) {
                yield* exerciseRepo.addTags(exercise.id, payload.tagIds);
              }

              return exercise;
            }),
          ).pipe(Effect.timeout(5000));
        },

        selectAll: (
          urlParams: typeof SelectAllExercisesUrlParams.Type,
          userId: Exercise["userId"],
        ) => {
          const pageSize = 20;

          return exerciseRepo.selectAll(userId, pageSize, urlParams).pipe(
            Effect.map((rows) => {
              const hasMore = rows.length > pageSize;

              const exercises = hasMore ? rows.slice(0, pageSize) : rows;

              const lastItem = exercises.at(-1);

              return {
                exercises,
                nextCursor: hasMore && lastItem ? lastItem.index : null,
              };
            }),
            Effect.timeout(5000),
          );
        },

        reorder: (
          payload: typeof ReorderExercisesPayload.Type,
          userId: Exercise["userId"],
        ) => {
          const reversedTileIds = payload.exerciseIds.toReversed();

          return exerciseRepo
            .reorder(reversedTileIds, userId)
            .pipe(Effect.timeout(5000));
        },

        patch: (
          exerciseId: Exercise["id"],
          userId: Exercise["userId"],
          input: { name: string },
        ) => {
          return exerciseRepo
            .patch(exerciseId, userId, input)
            .pipe(Effect.timeout(5000));
        },

        selectTags: (
          exerciseId: Exercise["id"],
          userId: Exercise["userId"],
        ) => {
          return Effect.gen(function* () {
            yield* exerciseRepo.selectByExerciseId(exerciseId, userId);

            return yield* exerciseRepo.selectTagsByExerciseId(
              exerciseId,
              userId,
            );
          }).pipe(Effect.timeout(5000));
        },

        setTags: (
          exerciseId: Exercise["id"],
          userId: Exercise["userId"],
          tagIds: ReadonlyArray<number>,
        ) => {
          return withTransaction(
            Effect.gen(function* () {
              yield* exerciseRepo.selectByExerciseId(exerciseId, userId);

              yield* exerciseRepo.putTagsByExerciseId(exerciseId, tagIds);

              return yield* exerciseRepo.selectTagsByExerciseId(
                exerciseId,
                userId,
              );
            }),
          ).pipe(Effect.timeout(5000));
        },

        delete: (exerciseId: Exercise["id"], userId: Exercise["userId"]) => {
          return exerciseRepo
            .deleteById(exerciseId, userId)
            .pipe(Effect.timeout(5000));
        },

        getStats: (userId: Exercise["userId"]) => {
          return exerciseRepo.selectStats(userId).pipe(
            Effect.map(({ totals, setCountPerExercise, setCountPerTag, allSetDates }) => ({
              totalWeightInKg: totals.totalWeightInKg,
              totalRepetitions: totals.totalRepetitions,
              exerciseWithMostSets: setCountPerExercise.at(0) ?? null,
              exerciseWithLeastSets: setCountPerExercise.at(-1) ?? null,
              setCountPerExercise,
              setCountPerTag,
              allSets: allSetDates,
            })),
            Effect.timeout(5000),
          );
        },
      };
    }),
  },
) {}
