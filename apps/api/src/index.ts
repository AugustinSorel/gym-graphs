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
import { healthRouter } from "~/domains/health/health.router";
import { cors } from "hono/cors";
import { constant } from "@gym-graphs/constants";
import {
  securityHeadersMiddleware,
  rateLimiterMiddleware,
  authRateLimiterMiddleware,
  requestIdMiddleware,
} from "~/middlewares/security.middlewares";
import type { Db } from "~/libs/db";
import type { Email } from "~/libs/email";
import type { SessionCtx } from "~/domains/session/session.service";

export type * from "~/db/db.schemas";

export type Ctx = Readonly<{
  Variables: Readonly<{
    db: Db;
    email: Email;
    session: SessionCtx;
  }>;
}>;

const app = new Hono<Ctx>()
  .basePath("/api")
  // Security middlewares
  .use("*", requestIdMiddleware)
  .use("*", securityHeadersMiddleware)
  .use("*", rateLimiterMiddleware)
  // CORS
  .use(
    "*",
    cors({
      origin: constant.url.web,
      credentials: true,
    }),
  )
  // App middlewares
  .use(injectDbMiddleware)
  .use(injectEmailMiddleware)
  .use(injectSessionMiddleware)
  // Health check endpoints (no auth required)
  .route("/health", healthRouter)
  // Auth routes with stricter rate limiting
  .route("/sessions", sessionRouter.use("*", authRateLimiterMiddleware))
  .route("/users", userRouter.use("*", authRateLimiterMiddleware))
  .route("/email-verifications", emailVerificationRouter)
  .route("/password-resets", passwordResetRouter.use("*", authRateLimiterMiddleware))
  .route("/oauth", oauthRouter.use("*", authRateLimiterMiddleware))
  // Protected routes
  .route("/tags", tagRouter)
  .route("/tiles", tileRouter)
  .route("/exercises", exerciseRouter.route("/:exerciseId/sets", setRouter))
  .onError(errorHandler);

export type Api = typeof app;

serve({
  fetch: app.fetch,
  port: env.PORT,
});
