import { createServerFn } from "@tanstack/start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { tagSchema } from "~/tag/tag.schemas";
import {
  addExerciseTags,
  createTag,
  deleteExerciseTags,
  deleteTag,
  selectExerciseTags,
  selectTagsFrequency,
} from "~/tag/tag.services";
import pg from "pg";
import { z } from "zod";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { injectDbMiddleware } from "~/db/db.middlewares";

export const createTagAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(tagSchema.pick({ name: true }))
  .handler(async ({ context, data }) => {
    try {
      await createTag(data.name, context.user.id, context.db);
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateName = dbError && e.constraint === "tag_name_user_id_pk";

      if (duplicateName) {
        throw new Error("tag name already created");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const deleteTagAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ tagId: tagSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await deleteTag(data.tagId, context.user.id, context.db);
  });

export const updateExerciseTagsAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      exerciseId: exerciseSchema.shape.id,
      newTags: tagSchema.shape.id.array().max(50),
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      await context.db.transaction(async (tx) => {
        const exerciseTags = await selectExerciseTags(
          context.user.id,
          data.exerciseId,
          tx,
        );

        const newExerciseTagsSet = new Set(data.newTags);
        const exerciseTagsSet = new Set(exerciseTags.map((e) => e.tagId));

        const tagsToAddSet = newExerciseTagsSet.difference(exerciseTagsSet);
        const tagsToRemoveSet = exerciseTagsSet.difference(newExerciseTagsSet);

        await addExerciseTags(
          context.user.id,
          data.exerciseId,
          [...tagsToAddSet],
          tx,
        );

        await deleteExerciseTags(
          context.user.id,
          data.exerciseId,
          [...tagsToRemoveSet],
          tx,
        );
      });
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateTag =
        dbError && e.constraint === "exercise_tag_tag_id_tag_id_fk";

      if (duplicateTag) {
        throw new Error("this tag already exists");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const selectTagsFrequencyAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    return selectTagsFrequency(context.user.id, context.db);
  });
