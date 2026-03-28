import { Effect } from "effect";
import { ExerciseRepo } from "./repo";
import type { Exercise, User } from "#/integrations/db/schema";
import { TagRepo } from "../tag/repo";

export class ExerciseService extends Effect.Service<ExerciseService>()(
  "ExerciseService",
  {
    accessors: true,
    dependencies: [ExerciseRepo.Default, TagRepo.Default],
    effect: Effect.gen(function* () {
      const exerciseRepo = yield* ExerciseRepo;
      const tagRepo = yield* TagRepo;

      return {
        selectByExerciseId: (
          exerciseId: Exercise["id"],
          userId: User["id"],
        ) => {
          return exerciseRepo
            .selectByExerciseId(exerciseId, userId)
            .pipe(Effect.timeout(5000));
        },

        selectTags: (exerciseId: Exercise["id"], userId: User["id"]) => {
          return tagRepo
            .selectExerciseTags(exerciseId, userId)
            .pipe(Effect.timeout(5000));
        },
      };
    }),
  },
) {}
