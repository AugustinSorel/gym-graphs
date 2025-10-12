import { z } from "zod";
import { AppError } from "~/libs/error";

export class TileNotFoundError extends AppError {
  constructor() {
    super("tile not found", 404);
  }
}

export class DashboardNotFoundError extends AppError {
  constructor() {
    super("dashboard not found", 404);
  }
}

export class TileDuplcateError extends AppError {
  public static check = (e: unknown) => {
    return z
      .object({ constraint: z.string() })
      .refine((e) => e.constraint === "tile_name_dashboard_id_unique")
      .safeParse(e).success;
  };

  constructor() {
    super("tile name already exists", 409);
  }
}
