import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { signUpSchema, signInSchema } from "@gym-graphs/schemas/session";
import { createSessionService } from "~/session/session.service";
import { createUserService } from "~/user/user.service";
import { createUserRepo } from "~/user/user.repo";
import { createSessionRepo } from "~/session/session.repo";
import { setCookie } from "hono/cookie";
import { sessionCookie } from "~/session/session.cookies";
import type { Ctx } from "~/index";

export const sessionRouter = new Hono<Ctx>();

sessionRouter.post("/sign-up", zValidator("json", signUpSchema), async (c) => {
  const input = c.req.valid("json");

  await c.var.db.transaction(async (tx) => {
    const userService = createUserService(createUserRepo(tx));
    const sessionService = createSessionService(createSessionRepo(tx));

    //TODO: add the remaining stuff

    const user = await userService.signUpWithEmailAndPassword(input);

    const session = await sessionService.create(user.id);

    setCookie(
      c,
      sessionCookie.name,
      session.token,
      sessionCookie.options(session.session.expiresAt),
    );
  });

  return c.json(undefined, 201);
});

sessionRouter.post("/sign-in", zValidator("json", signInSchema), async (c) => {
  const input = c.req.valid("json");

  await c.var.db.transaction(async (tx) => {
    const userService = createUserService(createUserRepo(tx));
    const sessionService = createSessionService(createSessionRepo(tx));

    const user = await userService.signInWithEmailAndPassword(input);

    const session = await sessionService.create(user.id);

    setCookie(
      c,
      sessionCookie.name,
      session.token,
      sessionCookie.options(session.session.expiresAt),
    );
  });

  return c.json(undefined, 201);
});
