import { AppError } from "~/libs/error";

export class TileNotFoundError extends AppError {
  constructor() {
    super("tile not found", 404);
  }
}
