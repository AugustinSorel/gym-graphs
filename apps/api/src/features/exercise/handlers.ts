import { Api } from "@gym-graphs/shared/api";
import { HttpApiBuilder, HttpApiError } from "@effect/platform";
import { Effect } from "effect";
import { ExerciseService } from "./service";
import { CurrentSession } from "@gym-graphs/shared/auth/middlewares";

export const ExerciseLive = HttpApiBuilder.group(
  Api,
  "Exercise",
  (handlers) => {
    return handlers.handle("get", ({ path }) => {
      return Effect.gen(function* () {
        const session = yield* CurrentSession;

        const exercise = yield* ExerciseService.selectByExerciseId(
          path.exerciseId,
          session.userId,
        );

        return yield* Effect.succeed({
          id: exercise.id,
          name: exercise.dashboardTile.name,
          tileId: exercise.dashboardTile.id,
        });
      }).pipe(
        Effect.catchTags({
          TimeoutException: () => new HttpApiError.RequestTimeout(),
          EffectDrizzleQueryError: () => new HttpApiError.InternalServerError(),
        }),
      );
    });
  },
);
