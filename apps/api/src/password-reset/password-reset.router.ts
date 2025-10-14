import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { userSchema } from "@gym-graphs/schemas/user";
import { passwordResetService } from "~/password-reset/password-reset.service";
import type { Ctx } from "~/index";

export const passwordResetRouter = new Hono<Ctx>();

passwordResetRouter.post(
  "/",
  zValidator("json", userSchema.pick({ email: true })),
  async (c) => {
    const input = c.req.valid("json");

    await passwordResetService.create(input, c.var.db, c.var.email);

    return c.json(undefined, 200);
  },
);
