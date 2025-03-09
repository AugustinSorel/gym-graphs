import { AppError } from "~/libs/error";
import pg from "pg";

export class SetDuplicateError extends AppError {
  public static check = (e: unknown) => {
    const isDuplicate =
      e instanceof pg.DatabaseError &&
      e.constraint === "set_done_at_exercise_id_unique";

    return isDuplicate;
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
