import { createServerFn } from "@tanstack/start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { setSchema } from "~/set/set.schemas";
import { db } from "~/utils/db";
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

export const createSetAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware])
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
        context.session.userId,
        data.exerciseId,
        db,
      );

      if (!exercise) {
        throw new Error("exercise not found");
      }

      await createSet(data.weightInKg, data.repetitions, data.exerciseId, db);
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
  .middleware([authGuardMiddleware])
  .validator(
    z.object({
      weightInKg: setSchema.shape.weightInKg,
      setId: setSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    await updateSetWeight(
      data.setId,
      context.session.userId,
      data.weightInKg,
      db,
    );
  });

export const updateSetRepetitionsAction = createServerFn({
  method: "POST",
})
  .middleware([authGuardMiddleware])
  .validator(
    z.object({
      repetitions: setSchema.shape.repetitions,
      setId: setSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    await updateSetRepetitions(
      data.setId,
      context.session.userId,
      data.repetitions,
      db,
    );
  });

export const updateSetDoneAtAction = createServerFn({
  method: "POST",
})
  .middleware([authGuardMiddleware])
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
        context.session.userId,
        data.doneAt,
        db,
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
  .middleware([authGuardMiddleware])
  .validator(z.object({ setId: setSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await deleteSet(data.setId, context.session.userId, db);
  });
