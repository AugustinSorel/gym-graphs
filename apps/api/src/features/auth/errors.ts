import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

export class InvalidCredentials extends Schema.TaggedError<InvalidCredentials>()(
  "InvalidCredentials",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Invalid email or password",
    }),
  },
  HttpApiSchema.annotations({ status: 401 }),
) {}

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Unauthorized",
    }),
  },
  HttpApiSchema.annotations({ status: 401 }),
) {}
