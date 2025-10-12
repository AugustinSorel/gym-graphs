import { registerGlobalMiddleware } from "@tanstack/react-start";
import { rateLimiterMiddleware } from "~/auth/auth.middlewares";
import { errorMiddleware } from "~/libs/error";

registerGlobalMiddleware({
  middleware: [errorMiddleware, rateLimiterMiddleware],
});
