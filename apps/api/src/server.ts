import { Context, Effect, Layer, pipe, Redacted } from "effect";
import { serverConfig } from "./env";
import { HttpApiBuilder, HttpApiSwagger, HttpServer } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { createServer } from "node:http";
import { AuthLive } from "#/features/auth/handlers";
import { Api } from "#/api";
import { PgClient } from "@effect/sql-pg";
import { types } from "pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { users } from "#/integrations/db/schema";

const PgClientLive = PgClient.layer({
  url: Redacted.make("postgres://postgres:postgres@localhost:5432/gym_graphs"),
  types: {
    getTypeParser: (typeId, format) => {
      if (
        [1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182].includes(typeId)
      ) {
        return (val: any) => val;
      }
      return types.getTypeParser(typeId, format);
    },
  },
});

const dbEffect = PgDrizzle.make().pipe(
  Effect.provide(PgDrizzle.DefaultServices),
);

class DB extends Context.Tag("DB")<
  DB,
  Effect.Effect.Success<typeof dbEffect>
>() {}

const DBLive = Layer.effect(
  DB,
  Effect.gen(function* () {
    return yield* dbEffect;
  }),
);

const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(AuthLive));

export const ServerLive = Layer.unwrapEffect(
  pipe(
    serverConfig,
    Effect.andThen((env) =>
      HttpApiBuilder.serve().pipe(
        HttpServer.withLogAddress,
        Layer.provide(
          Layer.effectDiscard(
            Effect.gen(function* () {
              const db = yield* DB;
              const u = yield* db.select().from(users);
              console.log(u);
              return u;
            }),
          ),
        ),
        Layer.provide(HttpApiSwagger.layer({ path: "/doc" })),
        Layer.provide(ApiLive),
        Layer.provide(Layer.provideMerge(DBLive, PgClientLive)),
        Layer.provide(NodeHttpServer.layer(createServer, { port: env.port })),
      ),
    ),
  ),
);
