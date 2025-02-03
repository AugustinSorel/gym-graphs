import { createMiddleware } from "@tanstack/start";
import { db } from "~/libs/db";

export const injectDbMiddleware = createMiddleware().server(({ next }) => {
  return next({
    context: {
      db,
    },
  });
});
