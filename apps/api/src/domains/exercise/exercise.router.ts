import { Hono } from "hono";
import { requireAuthMiddleware } from "~/domains/session/session.middlewares";
import { exerciseSchema } from "@gym-graphs/schemas/exercise";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { exerciseService } from "~/domains/exercise/exercise.service";
import type { Ctx } from "~/index";

export const exerciseRouter = new Hono<Ctx>().get(
  "/:exerciseId",
  requireAuthMiddleware,
  zValidator(
    "param",
    z.object({ exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id) }),
  ),
  async (c) => {
    const param = c.req.valid("param");

    const exercise = await exerciseService.selectById(
      c.var.user.id,
      param.exerciseId,
      c.var.db,
    );

    return c.json(exercise, 200);
  },
);
