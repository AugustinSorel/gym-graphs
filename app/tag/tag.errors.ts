import { z } from "zod";
import { AppError } from "~/libs/error";

export class TagNotFoundError extends AppError {
  constructor() {
    super("tag not found", 404);
  }
}

export class TagDuplicateError extends AppError {
  public static check = (e: unknown) => {
    return z
      .object({ constraint: z.string() })
      .refine((e) => e.constraint === "tag_name_user_id_unique")
      .safeParse(e).success;
  };

  constructor() {
    super("tag already exists", 409);
  }
}
