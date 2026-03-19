import { Effect } from "effect";
import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Api } from "@gym-graphs/shared/contracts/api";

const makeClient = HttpApiClient.make(Api, {
  baseUrl: "http://localhost:5000",
});

type Client = Effect.Effect.Success<typeof makeClient>;

export const callApi = <A, E>(
  call: (client: Client) => Effect.Effect<A, E, never>,
) => {
  const program = Effect.gen(function* () {
    const client = yield* makeClient;
    return yield* call(client);
  }).pipe(Effect.provide(FetchHttpClient.layer));

  return Effect.runPromise(program);
};
