import { pipe, Schema } from "effect";

export const TagSchema = Schema.Struct({
  id: Schema.Positive,
  userId: Schema.Positive,
  name: pipe(
    Schema.Trim.annotations({
      message: () => "name must be a valid string",
    }),
    Schema.nonEmptyString({ message: () => "name is required" }),
    Schema.minLength(3, {
      message: () => "name must be at least 3 characters",
    }),
    Schema.maxLength(255, {
      message: () => "name must be at most 255 characters",
    }),
  ),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export type Tag = typeof TagSchema.Type;

export const TagSuccessSchema = TagSchema.pick("id", "name");

export const TagWithCountSchema = Schema.Struct({
  ...TagSuccessSchema.fields,
  exerciseCount: Schema.NonNegativeInt,
});

export const CreateTagPayload = TagSchema.pick("name");

export const PatchTagPayload = TagSchema.pick("name");
