import { createMiddleware } from "@tanstack/react-start";
import { db } from "~/libs/db";

export const injectDbMiddleware = createMiddleware({ type: "function" }).server(
  ({ next }) => {
    return next({
      context: {
        db,
      },
    });
  },
);
