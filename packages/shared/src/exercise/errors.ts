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

export class DuplicateExercise extends Schema.TaggedError<DuplicateExercise>()(
  "DuplicateExercise",
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 409 }),
) {
  static withName(name: string) {
    return new DuplicateExercise({
      message: `Dashboard Tile with name ${name} already exists`,
    });
  }
}
