import { createMiddleware } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { AppError } from "~/libs/error";

export const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (e) {
    if (e instanceof AppError) {
      setResponseStatus(e.statusCode);
    }

    throw e;
  }
});
