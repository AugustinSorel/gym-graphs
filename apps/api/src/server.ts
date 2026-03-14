import { Effect, Layer } from "effect";
import { ServerConfig } from "./env";
import { HttpApiBuilder, HttpApiSwagger, HttpServer } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { createServer } from "node:http";
import { AuthLive } from "#/features/auth/handlers";
import { Api } from "#/api";
import { Database } from "#/integrations/db/db";
import { AuthCookies } from "./features/auth/cookies";
import { AuthService } from "./features/auth/service";

const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(AuthLive));

const HttpServerLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const env = yield* ServerConfig;
    return NodeHttpServer.layer(createServer, { port: env.port });
  }),
);

export const ServerLive = HttpApiBuilder.serve().pipe(
  HttpServer.withLogAddress,
  Layer.provide(HttpApiSwagger.layer({ path: "/doc" })),
  Layer.provide(ApiLive),
  Layer.provide(AuthService.Default),
  Layer.provide(AuthCookies.Default),
  Layer.provide(Database.Default),
  Layer.provide(HttpServerLive),
  Layer.provide(ServerConfig.Default),
);
