import { createServerFn } from "@tanstack/start";
import { authGuard } from "~/auth/auth.middlewares";
import { tagSchema } from "./tag.schemas";
import { db } from "~/utils/db";
import { createTag, deleteTag } from "./tag.services";
import pg from "pg";

export const createTagAction = createServerFn({ method: "POST" })
  .middleware([authGuard])
  .validator(tagSchema.pick({ name: true }))
  .handler(async ({ context, data }) => {
    try {
      await createTag(data.name, context.user.id, db);
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
  .middleware([authGuard])
  .validator(tagSchema.pick({ name: true }))
  .handler(async ({ context, data }) => {
    await deleteTag(data.name, context.user.id, db);
  });
