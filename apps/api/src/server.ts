import { Effect, Layer } from "effect";
import { ServerConfig } from "./env";
import { HttpApiBuilder, HttpApiSwagger, HttpServer } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { createServer } from "node:http";
import { AuthLive } from "#/features/auth/handlers";
import { Api } from "#/api";
import { CurrentDbLive, Database, PgClientLive } from "#/integrations/db/db";
import { Crypto } from "#/integrations/crypto/crypto";
import { UserRepo } from "./features/user/repo";

const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(AuthLive));

export const ServerLive = HttpApiBuilder.serve().pipe(
  HttpServer.withLogAddress,
  Layer.provide(HttpApiSwagger.layer({ path: "/doc" })),
  Layer.provide(ApiLive),
  Layer.provide(UserRepo.Default),
  Layer.provide(
    Layer.provideMerge(
      CurrentDbLive,
      Layer.provideMerge(Database.Default, PgClientLive),
    ),
  ),
  Layer.provide(Crypto.Default),
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
