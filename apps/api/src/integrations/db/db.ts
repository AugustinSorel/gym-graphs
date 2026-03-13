import { Context, Effect, Layer } from "effect";
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
  effect: PgDrizzle.make({ relations }).pipe(
    Effect.provide(PgDrizzle.DefaultServices),
  ),
  accessors: true,
}) {}

type DatabaseInstance = Effect.Effect.Success<
  ReturnType<typeof PgDrizzle.make<Record<string, unknown>, typeof relations>>
>;

type TransactionInstance = Parameters<
  DatabaseInstance["transaction"]
>[0] extends (tx: infer T) => any
  ? T
  : never;

type DbOrTransaction = DatabaseInstance | TransactionInstance;

export class DbClient extends Context.Tag("DbClient")<
  DbClient,
  DbOrTransaction
>() {}

export const CurrentDbLive = Layer.effect(
  DbClient,
  Effect.map(Database, (db) => db),
);

export const withTransaction = <A, E, R>(effect: Effect.Effect<A, E, R>) => {
  return Effect.gen(function* () {
    const db = yield* Database;

    return yield* db.transaction((tx) => {
      return effect.pipe(Effect.provideService(DbClient, tx));
    });
  });
};
