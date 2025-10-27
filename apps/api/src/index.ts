import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "~/env";
import { sessionRouter } from "~/domains/session/session.router";
import { errorHandler } from "~/libs/error";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { injectEmailMiddleware } from "~/libs/email";
import { injectSessionMiddleware } from "~/domains/session/session.middlewares";
import { emailVerificationRouter } from "~/domains/email-verification/email-verification.router";
import { passwordResetRouter } from "~/domains/password-reset/password-reset.router";
import { oauthRouter } from "~/domains/oauth/oauth.router";
import { userRouter } from "~/domains/user/user.router";
import { tagRouter } from "~//domains/tag/tag.router";
import { tileRouter } from "~/domains/tile/tile.router";
import { exerciseRouter } from "~/domains/exercise/exercise.router";
import { setRouter } from "~/domains/set/set.router";
import { cors } from "hono/cors";
import { constant } from "@gym-graphs/constants";
import type { Db } from "~/libs/db";
import type { Email } from "~/libs/email";
import type { SessionCtx } from "~/domains/session/session.service";

console.log(env, constant);

export type Ctx = Readonly<{
  Variables: Readonly<{
    db: Db;
    email: Email;
    session: SessionCtx;
  }>;
}>;

const app = new Hono<Ctx>()
  .basePath("/api")
  .use(
    "*",
    cors({
      origin: constant.url.web,
      credentials: true,
    }),
  )
  .use(injectDbMiddleware)
  .use(injectEmailMiddleware)
  .use(injectSessionMiddleware)
  .route("/sessions", sessionRouter)
  .route("/users", userRouter)
  .route("/email-verifications", emailVerificationRouter)
  .route("/password-resets", passwordResetRouter)
  .route("/oauth", oauthRouter)
  .route("/tags", tagRouter)
  .route("/tiles", tileRouter)
  .route("/exercises", exerciseRouter.route("/:exerciseId/sets", setRouter))
  .onError(errorHandler);

export type Api = typeof app;

serve({
  fetch: app.fetch,
  port: env.PORT,
});
