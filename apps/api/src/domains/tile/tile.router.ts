import { Hono } from "hono";
import { tileService } from "~/domains/tile/tile.service";
import { zValidator } from "@hono/zod-validator";
import { tileSchema } from "@gym-graphs/schemas/tile";
import { requireAuthMiddleware } from "~/domains/session/session.middlewares";
import type { Ctx } from "~/index";

export const tileRouter = new Hono<Ctx>().post(
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
);
