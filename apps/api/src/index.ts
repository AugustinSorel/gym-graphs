import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer, Schema } from "effect";
import { createServer } from "node:http";

const MyApi = HttpApi.make("MyApi").add(
  HttpApiGroup.make("Greetings").add(
    HttpApiEndpoint.get("hello-world")`/`.addSuccess(Schema.String),
  ),
);

const GreetingsLive = HttpApiBuilder.group(MyApi, "Greetings", (handlers) =>
  handlers.handle("hello-world", () => Effect.succeed("Hello, World!")),
);

const MyApiLive = HttpApiBuilder.api(MyApi).pipe(Layer.provide(GreetingsLive));

const ServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(MyApiLive),
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);
