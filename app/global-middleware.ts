import { registerGlobalMiddleware } from "@tanstack/react-start";
import { rateLimiterMiddleware } from "~/auth/auth.middlewares";

registerGlobalMiddleware({
  middleware: [rateLimiterMiddleware],
});
