import { env } from "~/env";
import { createHash } from "crypto";
import { buildError } from "~/error";
import { err, ok } from "neverthrow";

export const oneDayInMs = 1_000 * 60 * 60 * 24;
export const fifteenDaysInMs = oneDayInMs * 15;
export const thirtyDaysInMs = oneDayInMs * 30;

export const getDbUrl = () => {
  return `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
};

export const hashSHA256Hex = (input: string) => {
  return createHash("sha256").update(input, "utf-8").digest("hex");
};

export const extractEntityFromRows = <T extends any>(rows: Array<T>) => {
  const entity = rows.at(0);

  if (!entity) {
    return err(buildError("entity not returned"));
  }

  return ok(entity);
};
