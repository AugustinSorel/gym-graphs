import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

export const sessionApi = HttpApiGroup.make("Session").add(
  HttpApiEndpoint.post("signIn", "/sessions").addSuccess(Schema.String),
);
