import { Hono } from "hono";
import { env } from "~/env";
import { sessionRouter } from "~/session/session.router";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { errorHandler } from "~/libs/error";
import type { Db } from "~/libs/db";

export type Ctx = {
  Variables: {
    db: Db;
  };
};

const app = new Hono<Ctx>()
  .basePath("/api")
  .use(injectDbMiddleware)
  .route("/", sessionRouter)
  .onError(errorHandler);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
