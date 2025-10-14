import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { userSchema } from "@gym-graphs/schemas/user";
import { passwordResetService } from "~/password-reset/password-reset.service";
import { confirmPasswordResetSchema } from "@gym-graphs/schemas/password-reset";
import { setCookie } from "hono/cookie";
import { sessionCookie } from "~/session/session.cookies";
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

passwordResetRouter.post(
  "/confirm",
  zValidator("json", confirmPasswordResetSchema),
  async (c) => {
    const input = c.req.valid("json");

    const session = await passwordResetService.confirm(input, c.var.db);

    setCookie(
      c,
      sessionCookie.name,
      session.token,
      sessionCookie.optionsForExpiry(session.session.expiresAt),
    );

    c.json(undefined, 200);
  },
);
