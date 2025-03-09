import { createServerFn } from "@tanstack/react-start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { setSchema } from "~/set/set.schemas";
import { selectExercise } from "~/exercise/exercise.services";
import {
  createSet,
  deleteSet,
  selectSetById,
  updateSetDoneAt,
  updateSetRepetitions,
  updateSetWeight,
} from "~/set/set.services";
import { z } from "zod";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { notifyTeamsFromNewOneRepMax } from "~/team/team.services";
import { calculateOneRepMax, getBestSetFromSets } from "~/set/set.utils";
import { ExerciseNotFoundError } from "~/exercise/exercise.errors";
import { SetNotFoundError } from "~/set/set.errors";

export const createSetAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    setSchema.pick({
      exerciseId: true,
      repetitions: true,
      weightInKg: true,
    }),
  )
  .handler(async ({ context, data }) => {
    const exercise = await selectExercise(
      context.user.id,
      data.exerciseId,
      context.db,
    );

    if (!exercise) {
      throw new ExerciseNotFoundError();
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
        context.user.oneRepMaxAlgo,
      );

      const candidateBestOneRepMaxInKg = calculateOneRepMax(
        newSet.repetitions,
        newSet.weightInKg,
        context.user.oneRepMaxAlgo,
      );

      const newOneRepMax = candidateBestOneRepMaxInKg > currentOneRepMaxInKg;

      if (newOneRepMax) {
        await notifyTeamsFromNewOneRepMax(
          context.user,
          exercise.tile.name,
          candidateBestOneRepMaxInKg,
          context.db,
        );
      }
    }
  });

export const updateSetWeightAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      weightInKg: setSchema.shape.weightInKg,
      setId: setSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    const set = await selectSetById(context.user.id, data.setId, context.db);

    if (!set) {
      throw new SetNotFoundError();
    }

    await updateSetWeight(
      data.setId,
      context.user.id,
      data.weightInKg,
      context.db,
    );

    const currentBestSet = getBestSetFromSets(set.exercise.sets);

    if (currentBestSet) {
      const currentOneRepMaxInKg = calculateOneRepMax(
        currentBestSet.repetitions,
        currentBestSet.weightInKg,
        context.user.oneRepMaxAlgo,
      );

      const candidateBestOneRepMaxInKg = calculateOneRepMax(
        set.repetitions,
        data.weightInKg,
        context.user.oneRepMaxAlgo,
      );

      const newOneRepMax = candidateBestOneRepMaxInKg > currentOneRepMaxInKg;

      if (newOneRepMax) {
        await notifyTeamsFromNewOneRepMax(
          context.user,
          set.exercise.tile.name,
          candidateBestOneRepMaxInKg,
          context.db,
        );
      }
    }
  });

export const updateSetRepetitionsAction = createServerFn({
  method: "POST",
})
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      repetitions: setSchema.shape.repetitions,
      setId: setSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    const set = await selectSetById(context.user.id, data.setId, context.db);

    if (!set) {
      throw new SetNotFoundError();
    }

    await updateSetRepetitions(
      data.setId,
      context.user.id,
      data.repetitions,
      context.db,
    );

    const currentBestSet = getBestSetFromSets(set.exercise.sets);

    if (currentBestSet) {
      const currentOneRepMaxInKg = calculateOneRepMax(
        currentBestSet.repetitions,
        currentBestSet.weightInKg,
        context.user.oneRepMaxAlgo,
      );

      const candidateBestOneRepMaxInKg = calculateOneRepMax(
        data.repetitions,
        set.weightInKg,
        context.user.oneRepMaxAlgo,
      );

      const newOneRepMax = candidateBestOneRepMaxInKg > currentOneRepMaxInKg;

      if (newOneRepMax) {
        await notifyTeamsFromNewOneRepMax(
          context.user,
          set.exercise.tile.name,
          candidateBestOneRepMaxInKg,
          context.db,
        );
      }
    }
  });

export const updateSetDoneAtAction = createServerFn({
  method: "POST",
})
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      doneAt: setSchema.shape.doneAt,
      setId: setSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    await updateSetDoneAt(data.setId, context.user.id, data.doneAt, context.db);
  });

export const deleteSetAction = createServerFn({
  method: "POST",
})
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ setId: setSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await deleteSet(data.setId, context.user.id, context.db);
  });
