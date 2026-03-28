import { Effect } from "effect";
import { SetRepo } from "./repo";
import { ExerciseRepo } from "../exercise/repo";
import type { CreateSetPayload, PatchSetPayload } from "@gym-graphs/shared/set/schemas";
import type { Set } from "#/integrations/db/schema";
import type { DashboardTile } from "#/integrations/db/schema";
import { ExerciseNotFound } from "@gym-graphs/shared/exercise/errors";

export class SetService extends Effect.Service<SetService>()("SetService", {
  accessors: true,
  dependencies: [SetRepo.Default, ExerciseRepo.Default],
  effect: Effect.gen(function* () {
    const setRepo = yield* SetRepo;
    const exerciseRepo = yield* ExerciseRepo;

    return {
      create: (
        exerciseId: Set["exerciseId"],
        userId: DashboardTile["userId"],
        payload: typeof CreateSetPayload.Type,
      ) => {
        return Effect.gen(function* () {
          const exercise = yield* exerciseRepo.selectByExerciseId(
            exerciseId,
            userId,
          );

          return yield* setRepo.create({
            exerciseId: exercise.id,
            weightInKg: payload.weightInKg,
            repetitions: payload.repetitions,
            doneAt: payload.doneAt,
          });
        }).pipe(Effect.timeout(5000));
      },

      patch: (
        exerciseId: Set["exerciseId"],
        setId: Set["id"],
        userId: DashboardTile["userId"],
        payload: typeof PatchSetPayload.Type,
      ) => {
        return Effect.gen(function* () {
          yield* exerciseRepo
            .selectByExerciseId(exerciseId, userId)
            .pipe(
              Effect.catchTag("ExerciseNotFound", () =>
                Effect.fail(new ExerciseNotFound()),
              ),
            );

          return yield* setRepo.patch(setId, exerciseId, payload);
        }).pipe(Effect.timeout(5000));
      },

      delete: (
        exerciseId: Set["exerciseId"],
        setId: Set["id"],
        userId: DashboardTile["userId"],
      ) => {
        return Effect.gen(function* () {
          yield* exerciseRepo.selectByExerciseId(exerciseId, userId);
          yield* setRepo.deleteById(setId, exerciseId);
        }).pipe(Effect.timeout(5000));
      },
    };
  }),
}) {}
