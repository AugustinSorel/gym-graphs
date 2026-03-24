import { Schema } from "effect";

export const ExerciseSchema = Schema.Struct({
  id: Schema.Positive,
});
