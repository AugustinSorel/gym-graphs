import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

export class SetNotFound extends Schema.TaggedError<SetNotFound>()(
  "SetNotFound",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Set not found.",
    }),
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}
