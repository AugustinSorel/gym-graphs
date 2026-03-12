import { Api } from "#/api";
import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";

export const AuthLive = HttpApiBuilder.group(Api, "Auth", (handlers) => {
  return handlers.handle("signUp", ({ payload }) => {
    console.log(payload);

    return Effect.succeed("Hello, World!");
  });
});
