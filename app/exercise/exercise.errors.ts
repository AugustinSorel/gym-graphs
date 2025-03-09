import { AppError } from "~/libs/error";

export class ExerciseNotFoundError extends AppError {
  constructor() {
    super("exercise not found", 404);
  }
}
