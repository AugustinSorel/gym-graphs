import { Context, Effect, Layer } from "effect";
import { ServerConfig } from "./env";
import { HttpApiBuilder, HttpApiSwagger, HttpServer } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { createServer } from "node:http";
import { AuthLive } from "#/features/auth/handlers";
import { Api } from "#/api";
import { PgClient } from "@effect/sql-pg";
import { types } from "pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";

const PgClientLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const env = yield* ServerConfig;

    return PgClient.layer({
      url: env.db.url,
      types: {
        getTypeParser: (typeId, format) => {
          if (
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

export const ServerLive = HttpApiBuilder.serve().pipe(
  HttpServer.withLogAddress,
  Layer.provide(HttpApiSwagger.layer({ path: "/doc" })),
  Layer.provide(ApiLive),
  Layer.provide(Layer.provideMerge(DBLive, PgClientLive)),
  Layer.provide(
    Layer.unwrapEffect(
      Effect.gen(function* () {
        const env = yield* ServerConfig;

        return NodeHttpServer.layer(createServer, { port: env.port });
      }),
    ),
  ),
  Layer.provide(ServerConfig.Default),
);
