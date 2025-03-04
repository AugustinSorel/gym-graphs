import { createServerFn } from "@tanstack/start";
import {
  authGuardMiddleware,
  rateLimiterMiddleware,
} from "~/auth/auth.middlewares";
import { tagSchema } from "~/tag/tag.schemas";
import {
  addTagToTile,
  createTag,
  deleteTag,
  removeTagToTile,
  renameTag,
} from "~/tag/tag.services";
import pg from "pg";
import { z } from "zod";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { tileSchema } from "~/dashboard/dashboard.schemas";

export const createTagAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
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

export const renameTagAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      tagId: tagSchema.shape.id,
      name: tagSchema.shape.name,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      await renameTag(data.name, context.user.id, data.tagId, context.db);
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
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ tagId: tagSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await deleteTag(data.tagId, context.user.id, context.db);
  });

export const addTagToTileAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      tileId: tileSchema.shape.id,
      tagId: tagSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      await addTagToTile(data.tileId, data.tagId, context.user.id, context.db);
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const tagAlreadyAdded =
        dbError && e.constraint === "tile_to_tags_tile_id_tag_id_pk";

      if (tagAlreadyAdded) {
        throw new Error("tag already added");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const removeTagToTileAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      tileId: tileSchema.shape.id,
      tagId: tagSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    await removeTagToTile(data.tileId, data.tagId, context.user.id, context.db);
  });
