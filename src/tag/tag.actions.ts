import { createServerFn } from "@tanstack/react-start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { tagSchema } from "~/tag/tag.schemas";
import {
  addTagToTile,
  createTag,
  deleteTag,
  removeTagToTile,
  renameTag,
} from "~/tag/tag.services";
import { z } from "zod";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { tileSchema } from "~/dashboard/dashboard.schemas";

export const createTagAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .inputValidator(tagSchema.pick({ name: true }))
  .handler(async ({ context, data }) => {
    await createTag(data.name, context.user.id, context.db);
  });

export const renameTagAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .inputValidator(
    z.object({
      tagId: tagSchema.shape.id,
      name: tagSchema.shape.name,
    }),
  )
  .handler(async ({ context, data }) => {
    await renameTag(data.name, context.user.id, data.tagId, context.db);
  });

export const deleteTagAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .inputValidator(z.object({ tagId: tagSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await deleteTag(data.tagId, context.user.id, context.db);
  });

export const addTagToTileAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .inputValidator(
    z.object({
      tileId: tileSchema.shape.id,
      tagId: tagSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    await addTagToTile(data.tileId, data.tagId, context.user.id, context.db);
  });

export const removeTagToTileAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .inputValidator(
    z.object({
      tileId: tileSchema.shape.id,
      tagId: tagSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    await removeTagToTile(data.tileId, data.tagId, context.user.id, context.db);
  });
