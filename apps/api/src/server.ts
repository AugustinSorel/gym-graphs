import { Effect, Layer, pipe } from "effect";
import { serverConfig } from "./env";
import { HttpApiBuilder, HttpApiSwagger, HttpServer } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { createServer } from "node:http";
import { SessionLive } from "#/features/sessions/handlers";
import { Api } from "#/api";

const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(SessionLive));

export const ServerLive = Layer.unwrapEffect(
  pipe(
    serverConfig,
    Effect.andThen((env) =>
      HttpApiBuilder.serve().pipe(
        Layer.provide(HttpApiSwagger.layer({ path: "/doc" })),
        HttpServer.withLogAddress,
        Layer.provide(ApiLive),
        Layer.provide(NodeHttpServer.layer(createServer, { port: env.port })),
      ),
    ),
  ),
);
