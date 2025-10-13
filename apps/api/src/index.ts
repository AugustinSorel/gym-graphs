import { Hono } from "hono";
import { env } from "~/env";
import { sessionRouter } from "~/session/session.router";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { errorHandler } from "~/libs/error";
import { injectEmailMiddleware } from "~/libs/email";
import type { Db } from "~/libs/db";
import type { Email } from "~/libs/email";

export type Ctx = {
  Variables: {
    db: Db;
    email: Email;
  };
};

const app = new Hono<Ctx>()
  .basePath("/api")
  .use(injectDbMiddleware)
  .use(injectEmailMiddleware)
  .route("/", sessionRouter)
  .onError(errorHandler);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
