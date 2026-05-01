import { pipe, Schema } from "effect";

export const SetSchema = Schema.Struct({
  id: Schema.Positive,
  exerciseId: Schema.Positive,
  weightInMg: pipe(
    Schema.Int.annotations({ message: () => "weightInMg must be a whole number" }),
    Schema.positive({ message: () => "weightInMg must be greater than 0" }),
  ),
  repetitions: Schema.Int.pipe(
    Schema.positive({ message: () => "repetitions must be at least 1" }),
  ),
  doneAt: Schema.Date.annotations({
    message: () => "doneAt must be a valid date",
  }),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export type Set = typeof SetSchema.Type;

export const SetSuccessSchema = SetSchema.pick(
  "id",
  "exerciseId",
  "weightInMg",
  "repetitions",
  "doneAt",
  "createdAt",
  "updatedAt",
);

export const CreateSetPayload = Schema.Struct({
  weightInMg: SetSchema.fields.weightInMg,
  repetitions: SetSchema.fields.repetitions,
  doneAt: Schema.optionalWith(Schema.Date, {
    default: () => new Date(),
  }),
});

export const PatchSetPayload = Schema.Struct({
  weightInMg: Schema.optionalWith(SetSchema.fields.weightInMg, {
    exact: true,
  }),
  repetitions: Schema.optionalWith(SetSchema.fields.repetitions, {
    exact: true,
  }),
  doneAt: Schema.optionalWith(Schema.Date, { exact: true }),
});

export const SelectSetsSuccess = SetSuccessSchema.pipe(Schema.Array);
