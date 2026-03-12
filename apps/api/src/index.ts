import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer, pipe, Schema } from "effect";
import { createServer } from "node:http";
import { serverConfig } from "./env";

const MyApi = HttpApi.make("MyApi").add(
  HttpApiGroup.make("Greetings").add(
    HttpApiEndpoint.get("hello-world")`/`.addSuccess(Schema.String),
  ),
);

const GreetingsLive = HttpApiBuilder.group(MyApi, "Greetings", (handlers) =>
  handlers.handle("hello-world", () => Effect.succeed("Hello, World!")),
);

const MyApiLive = HttpApiBuilder.api(MyApi).pipe(Layer.provide(GreetingsLive));

const ServerLive = Layer.unwrapEffect(
  pipe(
    serverConfig,
    Effect.andThen((env) =>
      HttpApiBuilder.serve().pipe(
        Layer.provide(MyApiLive),
        Layer.provide(NodeHttpServer.layer(createServer, { port: env.port })),
      ),
    ),
  ),
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);
