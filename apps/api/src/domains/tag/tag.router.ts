import { tagSchema } from "@gym-graphs/schemas/tag";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { requireAuthMiddleware } from "~/domains/session/session.middlewares";
import { tagService } from "~/domains/tag/tag.service";
import type { Ctx } from "~/index";

export const tagRouter = new Hono<Ctx>()
  .post(
    "/",
    requireAuthMiddleware,
    zValidator("json", tagSchema.pick({ name: true })),
    async (c) => {
      const input = c.req.valid("json");

      await tagService.create(input.name, c.var.user.id, c.var.db);

      return c.json(null, 200);
    },
  )
  .patch(
    "/:tagId",
    requireAuthMiddleware,
    zValidator(
      "param",
      z.object({ tagId: z.coerce.number().pipe(tagSchema.shape.id) }),
    ),
    zValidator("json", tagSchema.partial().pick({ name: true })),
    async (c) => {
      const params = c.req.valid("param");
      const input = c.req.valid("json");

      await tagService.patchById(input, c.var.user.id, params.tagId, c.var.db);

      return c.json(null, 200);
    },
  )
  .delete(
    "/:tagId",
    requireAuthMiddleware,
    zValidator(
      "param",
      z.object({ tagId: z.coerce.number().pipe(tagSchema.shape.id) }),
    ),
    async (c) => {
      const params = c.req.valid("param");

      await tagService.deleteById(params.tagId, c.var.user.id, c.var.db);

      return c.json(null, 200);
    },
  );
