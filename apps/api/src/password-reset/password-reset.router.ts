import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuthMiddleware } from "~/session/session.middlewares";
import { userSchema } from "@gym-graphs/schemas/user";
import { passwordResetService } from "~/password-reset/password-reset.service";
import type { Ctx } from "~/index";

export const passwordResetRouter = new Hono<Ctx>();

passwordResetRouter.post(
  "/",
  zValidator("json", userSchema.pick({ email: true })),
  requireAuthMiddleware,
  async (c) => {
    const input = c.req.valid("json");

    await passwordResetService.create(input.email, c.var.db, c.var.email);

    return c.json(undefined, 200);
  },
);
