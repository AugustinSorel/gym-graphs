import { Effect } from "effect";
import { ExerciseRepo } from "./repo";
import type { Exercise, User } from "#/integrations/db/schema";

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
      };
    }),
  },
) {}
