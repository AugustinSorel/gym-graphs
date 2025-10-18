import { signUpSchema } from "@gym-graphs/schemas/session";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { userService } from "~/domains/user/user.service";
import { sessionCookie } from "~/domains/session/session.cookies";
import { requireAuthMiddleware } from "~/domains/session/session.middlewares";
import { userPatchSchema } from "@gym-graphs/schemas/user";
import type { Ctx } from "~/index";

export const userRouter = new Hono<Ctx>()
  .post("/", zValidator("json", signUpSchema), async (c) => {
    const input = c.req.valid("json");

    const session = await userService.signUp(input, c.var.db, c.var.email);

    setCookie(
      c,
      sessionCookie.name,
      session.token,
      sessionCookie.optionsForExpiry(session.session.expiresAt),
    );

    return c.json(null, 200);
  })
  .get("/me", requireAuthMiddleware, async (c) => {
    const user = await userService.selectClient(c.var.user.id, c.var.db);

    return c.json(user, 200);
  })
  .patch(
    "/me",
    requireAuthMiddleware,
    zValidator("json", userPatchSchema),
    async (c) => {
      const input = c.req.valid("json");

      await userService.patchById(input, c.var.user.id, c.var.db);

      return c.json(null, 200);
    },
  )
  .delete("/me", requireAuthMiddleware, async (c) => {
    await userService.deleteById(c.var.user.id, c.var.db);

    setCookie(c, sessionCookie.name, "", sessionCookie.optionsForDeletion);

    return c.json(null, 200);
  });
