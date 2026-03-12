import { Effect, Layer } from "effect";
import { PgClient } from "@effect/sql-pg";
import { types } from "pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { ServerConfig } from "#/env";

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
  effect: PgDrizzle.make().pipe(Effect.provide(PgDrizzle.DefaultServices)),
  accessors: true,
}) {}
