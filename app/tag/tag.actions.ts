import { createServerFn } from "@tanstack/start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { tagSchema } from "~/tag/tag.schemas";
import { db } from "~/utils/db";
import {
  addExerciseTags,
  createTag,
  deleteExerciseTags,
  deleteTag,
  selectExerciseTags,
} from "./tag.services";
import pg from "pg";
import { z } from "zod";
import { exerciseSchema } from "~/exercise/exericse.schemas";

export const createTagAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware])
  .validator(tagSchema.pick({ name: true }))
  .handler(async ({ context, data }) => {
    try {
      await createTag(data.name, context.session.userId, db);
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
  .middleware([authGuardMiddleware])
  .validator(z.object({ tagId: tagSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await deleteTag(data.tagId, context.session.userId, db);
  });

export const updateExerciseTagsAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware])
  .validator(
    z.object({
      exerciseId: exerciseSchema.shape.id,
      newTags: tagSchema.shape.id.array().max(50),
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      await db.transaction(async (tx) => {
        const exerciseTags = await selectExerciseTags(
          context.session.userId,
          data.exerciseId,
          tx,
        );

        const newExerciseTagsSet = new Set(data.newTags);
        const exerciseTagsSet = new Set(exerciseTags.map((e) => e.tagId));

        const tagsToAddSet = newExerciseTagsSet.difference(exerciseTagsSet);
        const tagsToRemoveSet = exerciseTagsSet.difference(newExerciseTagsSet);

        await addExerciseTags(
          context.session.userId,
          data.exerciseId,
          [...tagsToAddSet],
          tx,
        );

        await deleteExerciseTags(
          context.session.userId,
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
