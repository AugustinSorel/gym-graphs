import { Schema } from "effect";

export const SetSchema = Schema.Struct({
  id: Schema.Positive,
  exerciseId: Schema.Positive,
  weightInMg: Schema.Int.pipe(Schema.positive()),
  repetitions: Schema.NonNegativeInt,
  doneAt: Schema.Date,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

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
