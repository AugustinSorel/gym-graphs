import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";
import { createMiddleware } from "hono/factory";
import type { Ctx } from "~/index";

/**
 * Security headers middleware
 * Adds common security headers to all responses
 */
export const securityHeadersMiddleware = secureHeaders({
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  xXssProtection: "1",
  referrerPolicy: "strict-origin-when-cross-origin",
  strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
});

/**
 * Rate limiter middleware
 * Limits requests per IP address to prevent abuse
 */
export const rateLimiterMiddleware = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: "draft-7", // Return rate limit info in the `RateLimit-*` headers
  keyGenerator: (c) => {
    // Use IP address as key, with fallback
    return c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown";
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authRateLimiterMiddleware = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: "draft-7",
  keyGenerator: (c) => {
    return c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown";
  },
  message: "Too many authentication attempts, please try again later",
});

/**
 * Request ID middleware
 * Adds a unique request ID for tracing
 */
export const requestIdMiddleware = createMiddleware<Ctx>(async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId" as any, requestId);
  c.header("X-Request-Id", requestId);
  await next();
});
