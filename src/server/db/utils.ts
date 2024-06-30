import type { PostgresError } from "postgres";

export const isPgError = (error: unknown): error is PostgresError => {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.constructor.name === "PostgresError";
};
