import { Hono } from "hono";
import { env } from "~/env";
import { sessionRouter } from "~/session/session.router";
import { errorHandler } from "~/libs/error";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { injectEmailMiddleware } from "~/libs/email";
import { injectSessionMiddleware } from "~/session/session.middlewares";
import type { Db } from "~/libs/db";
import type { Email } from "~/libs/email";
import type { SessionCtx } from "~/session/session.service";

export type Ctx = {
  Variables: {
    db: Db;
    email: Email;
    session: SessionCtx;
  };
};

const app = new Hono()
  .basePath("/api")
  .use(injectDbMiddleware)
  .use(injectEmailMiddleware)
  .use(injectSessionMiddleware)
  .route("/", sessionRouter)
  .onError(errorHandler);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
