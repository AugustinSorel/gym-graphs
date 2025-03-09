import { AppError } from "~/libs/error";
import pg from "pg";

export class TagNotFoundError extends AppError {
  constructor() {
    super("tag not found", 404);
  }
}

export class TagDuplicateError extends AppError {
  public static check = (e: unknown) => {
    const dbError = e instanceof pg.DatabaseError;
    const isDuplicate = dbError && e.constraint === "tag_name_user_id_unique";

    return isDuplicate;
  };

  constructor() {
    super("tag already exists", 409);
  }
}
