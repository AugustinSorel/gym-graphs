import { z } from "zod";
import { AppError } from "~/libs/error";

export class SetDuplicateError extends AppError {
  public static check = (e: unknown) => {
    return z
      .object({ constraint: z.string() })
      .refine((e) => e.constraint === "set_done_at_exercise_id_unique")
      .safeParse(e).success;
  };

  constructor() {
    super("set already exists", 409);
  }
}

export class SetNotFoundError extends AppError {
  constructor() {
    super("set not found", 404);
  }
}
