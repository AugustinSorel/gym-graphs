import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { userSchema } from "@gym-graphs/schemas/user";
import { passwordResetService } from "~/password-reset/password-reset.service";
import { passwordResetEmailBody } from "./password-reset.email";
import { userService } from "~/user/user.service";
import type { Ctx } from "~/index";

export const passwordResetRouter = new Hono<Ctx>();

passwordResetRouter.post(
  "/",
  zValidator("json", userSchema.pick({ email: true })),
  async (c) => {
    const input = c.req.valid("json");

    await c.var.db.transaction(async (tx) => {
      const user = await userService.selectByEmail(input.email, tx);

      await passwordResetService.deleteByUserId(user.id, c.var.db);

      const passwordReset = await passwordResetService.create(
        user.id,
        c.var.db,
      );

      const config = c.var.email.buildConfig(
        [user.email],
        "Reset your password",
        passwordResetEmailBody(passwordReset.token),
      );

      await c.var.email.client.send(config);
    });

    return c.json(undefined, 200);
  },
);
