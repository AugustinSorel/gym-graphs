import { registerGlobalMiddleware } from "@tanstack/react-start";
import { rateLimiterMiddleware } from "~/auth/auth.middlewares";
import { errorMiddleware } from "~/libs/idk";

registerGlobalMiddleware({
  middleware: [errorMiddleware, rateLimiterMiddleware],
});
