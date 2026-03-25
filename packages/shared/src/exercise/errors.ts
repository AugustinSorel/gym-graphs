import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

export class ExerciseNotFound extends Schema.TaggedError<ExerciseNotFound>()(
  "ExerciseNotFound",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Exercise not found.",
    }),
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}
