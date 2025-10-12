import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { signUpSchema } from "@gym-graphs/schemas/session";
import { createSessionService } from "~/session/session.service";
import { createUserService } from "~/user/user.service";
import { createUserModel } from "~/user/user.model";
import { createSessionModel } from "~/session/session.model";
import { setCookie } from "hono/cookie";
import { sessionCookie } from "~/session/session.cookies";
import type { Ctx } from "~/index";

export const sessionRouter = new Hono<Ctx>();

sessionRouter.post("/sign-up", zValidator("json", signUpSchema), async (c) => {
  const input = c.req.valid("json");

  await c.var.db.transaction(async (tx) => {
    const userService = createUserService(createUserModel(tx));
    const sessionService = createSessionService(createSessionModel(tx));

    const user = await userService.signUpWithEmailAndPassword(input);

    const session = await sessionService.create(user.id);

    setCookie(
      c,
      sessionCookie.name,
      session.token,
      sessionCookie.options(session.session.expiresAt),
    );
  });

  return c.status(200);
});
