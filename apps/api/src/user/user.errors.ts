import z from "zod";
import { AppError } from "~/libs/error";

export class UserNotFoundError extends AppError {
  constructor() {
    super("user not found", 404);
  }
}

export class UserDuplicateEmailErrorr extends AppError {
  public static check = (e: unknown) => {
    return z
      .object({ constraint: z.string() })
      .refine((e) => e.constraint === "user_email_unique")
      .safeParse(e).success;
  };

  constructor() {
    super("email is already used", 409);
  }
}
