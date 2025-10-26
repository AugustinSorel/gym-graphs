import { Hono } from "hono";
import { tileService } from "~/domains/tile/tile.service";
import { zValidator } from "@hono/zod-validator";
import { tileSchema } from "@gym-graphs/schemas/tile";
import { requireAuthMiddleware } from "~/domains/session/session.middlewares";
import { z } from "zod";
import { tagSchema } from "@gym-graphs/schemas/tag";
import type { Ctx } from "~/index";

export const tileRouter = new Hono<Ctx>()
  .get(
    "/",
    requireAuthMiddleware,
    zValidator(
      "query",
      z.object({
        name: tileSchema.shape.name
          .catch((e) => z.string().catch("").parse(e.value))
          .optional()
          .default(""),
        tags: z
          .string()
          .default("[]")
          .transform((raw) => JSON.parse(raw))
          .pipe(tagSchema.shape.name.array().max(200).optional().default([])),
        page: z.number().positive().catch(1),
      }),
    ),
    async (c) => {
      const query = c.req.valid("query");

      const tiles = await tileService.selectInfinite(
        query.name,
        query.tags,
        query.page,
        c.var.user.dashboard.id,
        c.var.db,
      );

      return c.json(tiles, 200);
    },
  )
  .post(
    "/",
    requireAuthMiddleware,
    zValidator("json", tileSchema.pick({ name: true })),
    async (c) => {
      const input = c.req.valid("json");

      await tileService.createExerciseTile(
        input.name,
        c.var.user.dashboard.id,
        c.var.db,
      );

      return c.json(null, 200);
    },
  )
  .patch(
    "/:tileId",
    requireAuthMiddleware,
    zValidator("json", tileSchema.partial().pick({ name: true })),
    zValidator(
      "param",
      z.object({ tileId: z.coerce.number().pipe(tileSchema.shape.id) }),
    ),
    async (c) => {
      const input = c.req.valid("json");
      const param = c.req.valid("param");

      await tileService.patchById(
        input,
        c.var.user.dashboard.id,
        param.tileId,
        c.var.db,
      );

      return c.json(null, 200);
    },
  )
  .delete(
    "/:tileId",
    requireAuthMiddleware,
    zValidator(
      "param",
      z.object({ tileId: z.coerce.number().pipe(tileSchema.shape.id) }),
    ),
    async (c) => {
      const param = c.req.valid("param");

      await tileService.deleteById(
        c.var.user.dashboard.id,
        param.tileId,
        c.var.db,
      );

      return c.json(null, 200);
    },
  )
  .post(
    "/:tileId/tags",
    requireAuthMiddleware,
    zValidator(
      "param",
      z.object({ tileId: z.coerce.number().pipe(tileSchema.shape.id) }),
    ),
    zValidator("json", z.object({ tagId: tagSchema.shape.id })),
    async (c) => {
      const input = c.req.valid("json");
      const param = c.req.valid("param");

      await tileService.addTag(
        param.tileId,
        input.tagId,
        c.var.user.id,
        c.var.db,
      );

      return c.json(null, 200);
    },
  )
  .put(
    "/reorder",
    requireAuthMiddleware,
    zValidator(
      "json",
      z.object({ tileIds: tileSchema.shape.id.array().max(200) }),
    ),
    async (c) => {
      const input = c.req.valid("json");

      const tiles = await tileService.reorder(
        input.tileIds,
        c.var.user.dashboard.id,
        c.var.db,
      );

      return c.json(tiles, 200);
    },
  );
