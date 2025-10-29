import { HTTPException } from "hono/http-exception";
import type { ErrorHandler } from "hono";
import type { Ctx } from "~/index";

//TODO: build better error msg

export const errorHandler: ErrorHandler<Ctx> = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }

  console.error(err);
  return c.json({ message: "internal server error" }, 500);
};
