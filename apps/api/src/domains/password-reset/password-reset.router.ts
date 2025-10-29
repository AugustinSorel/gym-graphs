import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { userSchema } from "@gym-graphs/schemas/user";
import { passwordResetService } from "~/domains/password-reset/password-reset.service";
import { passwordResetResetSchema } from "@gym-graphs/schemas/password-reset";
import { setCookie } from "hono/cookie";
import { sessionCookie } from "~/domains/session/session.cookies";
import type { Ctx } from "~/index";

export const passwordResetRouter = new Hono<Ctx>()
  .post(
    "/",
    zValidator("json", userSchema.pick({ email: true })),
    async (c) => {
      const input = c.req.valid("json");

      await passwordResetService.create(input, c.var.db, c.var.email);

      return c.json(null, 200);
    },
  )
  .post("/reset", zValidator("json", passwordResetResetSchema), async (c) => {
    const input = c.req.valid("json");

    const session = await passwordResetService.confirm(input, c.var.db);

    setCookie(
      c,
      sessionCookie.name,
      session.token,
      sessionCookie.optionsForExpiry(session.session.expiresAt),
    );

    return c.json(null, 200);
  });
