import { Api } from "#/api";
import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";

export const SessionLive = HttpApiBuilder.group(Api, "Session", (handlers) => {
  return handlers.handle("signIn", () => {
    return Effect.succeed("Hello, World!");
  });
});
