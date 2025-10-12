import { AppError } from "~/libs/error";

export class SessionNotFoundError extends AppError {
  constructor() {
    super("session not found", 404);
  }
}
