import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { ErrorHandler } from "hono";
import type { Ctx } from "~/index";

export const errorHandler: ErrorHandler<Ctx> = (err, c) => {
  console.log("HERE", err instanceof ZodError, err.constructor.name);

  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }

  console.error("API ERROR: ", err);
  return c.json({ message: "internal server error" }, 500);
};
