import { AppError } from "~/libs/error";

export class SetNotFoundError extends AppError {
  constructor() {
    super("set not found", 404);
  }
}
