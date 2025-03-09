import { AppError } from "~/libs/error";

export class SetDuplicateError extends AppError {
  constructor() {
    super("set already exists", 409);
  }
}

export class SetNotFoundError extends AppError {
  constructor() {
    super("set not found", 404);
  }
}
