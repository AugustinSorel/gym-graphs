import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpServer,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer, pipe, Schema } from "effect";
import { createServer } from "node:http";
import { serverConfig } from "./env";

const Api = HttpApi.make("Api").add(
  HttpApiGroup.make("Greetings").add(
    HttpApiEndpoint.get("hello-world")`/`.addSuccess(Schema.String),
  ),
);

const GreetingsLive = HttpApiBuilder.group(Api, "Greetings", (handlers) =>
  handlers.handle("hello-world", () => Effect.succeed("Hello, World!")),
);

const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(GreetingsLive));

const ServerLive = Layer.unwrapEffect(
  pipe(
    serverConfig,
    Effect.andThen((env) =>
      HttpApiBuilder.serve().pipe(
        HttpServer.withLogAddress,
        Layer.provide(ApiLive),
        Layer.provide(NodeHttpServer.layer(createServer, { port: env.port })),
      ),
    ),
  ),
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);
