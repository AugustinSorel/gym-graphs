import { AppError } from "~/libs/error";

export class UserNotFoundError extends AppError {
  constructor() {
    super("user not found", 404);
  }
}
