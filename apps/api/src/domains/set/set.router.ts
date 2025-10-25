import { setSchema } from "@gym-graphs/schemas/set";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireAuthMiddleware } from "~/domains/session/session.middlewares";
import { setService } from "~/domains/set/set.service";
import { exerciseSchema } from "@gym-graphs/schemas/exercise";
import { z } from "zod";
import type { Ctx } from "~/index";

export const setRouter = new Hono<Ctx>()
  .post(
    "/",
    requireAuthMiddleware,
    zValidator(
      "json",
      setSchema.pick({
        repetitions: true,
        weightInKg: true,
      }),
    ),
    zValidator(
      "param",
      z.object({ exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id) }),
    ),
    async (c) => {
      const input = c.req.valid("json");
      const param = c.req.valid("param");

      await setService.create(
        c.var.user.id,
        input.weightInKg,
        input.repetitions,
        param.exerciseId,
        c.var.db,
      );

      return c.json(null, 200);
    },
  )
  .patch(
    "/:setId",
    requireAuthMiddleware,
    zValidator(
      "param",
      z.object({
        exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id),
        setId: z.coerce.number().pipe(setSchema.shape.id),
      }),
    ),
    zValidator(
      "json",
      setSchema
        .pick({
          doneAt: true,
          repetitions: true,
          weightInKg: true,
        })
        .partial(),
    ),
    async (c) => {
      const param = c.req.valid("param");
      const input = c.req.valid("json");

      await setService.patchById(input, param.setId, c.var.user.id, c.var.db);

      return c.json(null, 200);
    },
  )
  .delete(
    "/:setId",
    requireAuthMiddleware,
    zValidator(
      "param",
      z.object({
        exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id),
        setId: z.coerce.number().pipe(setSchema.shape.id),
      }),
    ),
    async (c) => {
      const param = c.req.valid("param");

      await setService.deleteById(param.setId, c.var.user.id, c.var.db);

      return c.json(null, 200);
    },
  );
