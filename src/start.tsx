import { createStart } from "@tanstack/react-start";
import { errorMiddleware } from "~/libs/error";
import { rateLimiterMiddleware } from "~/auth/auth.middlewares";

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [errorMiddleware, rateLimiterMiddleware],
  };
});
