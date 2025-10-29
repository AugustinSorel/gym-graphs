import { HTTPException } from "hono/http-exception";
import type { ErrorHandler } from "hono";
import type { Ctx } from "~/index";

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

export const errorHandler: ErrorHandler<Ctx> = (err, c) => {
  if (err instanceof HTTPException) {
    const response: ErrorResponse = {
      message: err.message,
      code: `HTTP_${err.status}`,
    };
    return c.json(response, err.status);
  }

  // Log error for debugging (consider using a proper logging library in production)
  console.error("Unexpected error:", err);

  const response: ErrorResponse = {
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  };

  return c.json(response, 500);
};
