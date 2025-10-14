import { Hono } from "hono";
import { env } from "~/env";
import { sessionRouter } from "~/session/session.router";
import { errorHandler } from "~/libs/error";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { injectEmailMiddleware } from "~/libs/email";
import { injectSessionMiddleware } from "~/session/session.middlewares";
import { emailVerificationRouter } from "~/email-verification/email-verification.router";
import { passwordResetRouter } from "~/password-reset/password-reset.router";
import { oauthRouter } from "~/oauth/oauth.router";
import type { Db } from "~/libs/db";
import type { Email } from "~/libs/email";
import type { SessionCtx } from "~/session/session.service";

export type Ctx = Readonly<{
  Variables: Readonly<{
    db: Db;
    email: Email;
    session: SessionCtx;
  }>;
}>;

const app = new Hono<Ctx>()
  .basePath("/api")
  .use(injectDbMiddleware)
  .use(injectEmailMiddleware)
  .use(injectSessionMiddleware)
  .route("/", sessionRouter)
  .route("/email-verification", emailVerificationRouter)
  .route("/password-reset", passwordResetRouter)
  .route("/oauth", oauthRouter)
  .onError(errorHandler);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
