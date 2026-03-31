import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { Effect, Layer } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpApiClient,
} from "@effect/platform";
import { Api } from "@gym-graphs/shared/api";
import { sessionSecurity } from "@gym-graphs/shared/auth/middlewares";

const ClientLayer = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(FetchHttpClient.RequestInit, {
      credentials: "include",
    }),
  ),
);

const ServerCookieLayer = Layer.effect(
  HttpClient.HttpClient,
  Effect.gen(function* () {
    const baseClient = yield* HttpClient.HttpClient;
    const session = getCookie(sessionSecurity.key);

    if (!session) return baseClient;

    return baseClient.pipe(
      HttpClient.mapRequest(
        HttpClientRequest.setHeader(
          "cookie",
          `${sessionSecurity.key}=${session}`,
        ),
      ),
    );
  }),
);

const ServerLayer = ServerCookieLayer.pipe(
  Layer.provide(FetchHttpClient.layer),
);

const getIsomorphicLayer = createIsomorphicFn()
  .client(() => ClientLayer)
  .server(() => ServerLayer);

const makeClient = HttpApiClient.make(Api, {
  baseUrl: import.meta.dev ? "http://localhost:5000" : "api.gym-graphs.com",
});

type Client = Effect.Effect.Success<typeof makeClient>;

export type InferApiProps<
  A extends keyof Client,
  B extends keyof Client[A],
> = Client[A][B] extends (...args: any) => any
  ? Omit<Parameters<Client[A][B]>[0], "withResponse">
  : never;

export const callApi = <A, E>(
  call: (client: Client) => Effect.Effect<A, E, never>,
) => {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;

    return yield* call(client);
  }).pipe(Effect.provide(getIsomorphicLayer()));

  return Effect.runPromise(program);
};
