import { createServerFn } from "@tanstack/start";
import { selectSessionTokenMiddleware } from "./session.middlewares";

export const selectSessionTokenAction = createServerFn({ method: "GET" })
  .middleware([selectSessionTokenMiddleware])
  .handler(({ context }) => {
    return context.session;
  });
