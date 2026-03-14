import { Effect, Layer } from "effect";
import { PgClient } from "@effect/sql-pg";
import { types } from "pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { ServerConfig } from "#/env";
import { relations } from "./relations";

export const PgClientLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const env = yield* ServerConfig;

    return PgClient.layer({
      url: env.db.url,
      types: {
        getTypeParser: (typeId, format) => {
          if (
            // Return raw values for date/time types to let Drizzle handle parsing
            [1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182].includes(
              typeId,
            )
          ) {
            return (val: any) => val;
          }
          return types.getTypeParser(typeId, format);
        },
      },
    });
  }),
);

export class Database extends Effect.Service<Database>()("Database", {
  dependencies: [PgClientLive],
  effect: PgDrizzle.make({ relations }).pipe(
    Effect.provide(PgDrizzle.DefaultServices),
  ),
  accessors: true,
}) {}

export const withTransaction = <A, E, R>(effect: Effect.Effect<A, E, R>) => {
  return Effect.gen(function* () {
    const db = yield* Database;

    return yield* db.transaction((tx) => {
      return effect.pipe(
        Effect.provideService(Database, tx as unknown as Database),
      );
    });
  });
};
