import { createServerFn } from "@tanstack/start";
import {
  authGuardMiddleware,
  rateLimiterMiddleware,
} from "~/auth/auth.middlewares";
import { setSchema } from "~/set/set.schemas";
import { selectExercise } from "~/exercise/exercise.services";
import pg from "pg";
import {
  createSet,
  deleteSet,
  updateSetDoneAt,
  updateSetRepetitions,
  updateSetWeight,
} from "~/set/set.services";
import { z } from "zod";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { createTeamsEvents, selectTeamsByMemberId } from "~/team/team.services";
import { calculateOneRepMax, getBestSetFromSets } from "~/set/set.utils";

export const createSetAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(
    setSchema.pick({
      exerciseId: true,
      repetitions: true,
      weightInKg: true,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      const exercise = await selectExercise(
        context.user.id,
        data.exerciseId,
        context.db,
      );

      if (!exercise) {
        throw new Error("exercise not found");
      }

      const newSet = await createSet(
        data.weightInKg,
        data.repetitions,
        data.exerciseId,
        context.db,
      );

      const currentBestSet = getBestSetFromSets(exercise.sets);

      if (currentBestSet) {
        const currentOneRepMaxInKg = calculateOneRepMax(
          currentBestSet.repetitions,
          currentBestSet.weightInKg,
          "epley",
        );

        const candidateBestOneRepMaxInKg = calculateOneRepMax(
          newSet.repetitions,
          newSet.weightInKg,
          "epley",
        );

        const newOneRepMax = candidateBestOneRepMaxInKg > currentOneRepMaxInKg;

        if (newOneRepMax) {
          const teams = await selectTeamsByMemberId(
            context.user.id,
            context.db,
          );

          const events = teams.map((team) => ({
            name: "new one-rep max achieved!",
            description: `${context.user.name} just crushed a new PR on ${exercise.tile.name}: ${candidateBestOneRepMaxInKg}`,
            teamId: team.id,
          }));

          await createTeamsEvents(events, context.db);
        }
      }
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateSet =
        dbError && e.constraint === "exercise_set_done_at_exercise_id_unique";

      if (duplicateSet) {
        throw new Error("set already created for today");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const updateSetWeightAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      weightInKg: setSchema.shape.weightInKg,
      setId: setSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    await updateSetWeight(
      data.setId,
      context.user.id,
      data.weightInKg,
      context.db,
    );
  });

export const updateSetRepetitionsAction = createServerFn({
  method: "POST",
})
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      repetitions: setSchema.shape.repetitions,
      setId: setSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    await updateSetRepetitions(
      data.setId,
      context.user.id,
      data.repetitions,
      context.db,
    );
  });

export const updateSetDoneAtAction = createServerFn({
  method: "POST",
})
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      doneAt: setSchema.shape.doneAt,
      setId: setSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      await updateSetDoneAt(
        data.setId,
        context.user.id,
        data.doneAt,
        context.db,
      );
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateSet =
        dbError && e.constraint === "exercise_set_done_at_exercise_id_unique";

      if (duplicateSet) {
        throw new Error("set already created for this date");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const deleteSetAction = createServerFn({
  method: "POST",
})
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ setId: setSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await deleteSet(data.setId, context.user.id, context.db);
  });
