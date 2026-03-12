import { Effect, Layer } from "effect";
import { ServerConfig } from "./env";
import { HttpApiBuilder, HttpApiSwagger, HttpServer } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { createServer } from "node:http";
import { AuthLive } from "#/features/auth/handlers";
import { Api } from "#/api";
import { Database, PgClientLive } from "./integrations/db/db";

const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(AuthLive));

export const ServerLive = HttpApiBuilder.serve().pipe(
  HttpServer.withLogAddress,
  Layer.provide(HttpApiSwagger.layer({ path: "/doc" })),
  Layer.provide(ApiLive),
  Layer.provide(Layer.provideMerge(Database.Default, PgClientLive)),
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
