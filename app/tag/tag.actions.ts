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
import { setResponseStatus } from "@tanstack/react-start/server";
import { AppError } from "~/libs/error";

export const createTagAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(tagSchema.pick({ name: true }))
  .handler(async ({ context, data }) => {
    try {
      await createTag(data.name, context.user.id, context.db);
    } catch (e) {
      const code = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(code);
      throw e;
    }
  });

export const renameTagAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
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
      const code = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(code);
      throw e;
    }
  });

export const deleteTagAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ tagId: tagSchema.shape.id }))
  .handler(async ({ context, data }) => {
    try {
      await deleteTag(data.tagId, context.user.id, context.db);
    } catch (e) {
      const code = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(code);
      throw e;
    }
  });

export const addTagToTileAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
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
      const code = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(code);
      throw e;
    }
  });

export const removeTagToTileAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      tileId: tileSchema.shape.id,
      tagId: tagSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      await removeTagToTile(
        data.tileId,
        data.tagId,
        context.user.id,
        context.db,
      );
    } catch (e) {
      const code = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(code);
      throw e;
    }
  });
