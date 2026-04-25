import { Schema } from "effect";

export const SetSchema = Schema.Struct({
  id: Schema.Positive,
  exerciseId: Schema.Positive,
  weightInKg: Schema.NonNegativeInt,
  repetitions: Schema.Positive,
  doneAt: Schema.Date,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export const SetSuccessSchema = SetSchema.pick(
  "id",
  "exerciseId",
  "weightInKg",
  "repetitions",
  "doneAt",
  "createdAt",
  "updatedAt",
);

export const CreateSetPayload = Schema.Struct({
  weightInKg: SetSchema.fields.weightInKg,
  repetitions: SetSchema.fields.repetitions,
  doneAt: Schema.optionalWith(Schema.Date, {
    default: () => new Date(),
  }),
});

export const PatchSetPayload = Schema.Struct({
  weightInKg: Schema.optionalWith(SetSchema.fields.weightInKg, {
    exact: true,
  }),
  repetitions: Schema.optionalWith(SetSchema.fields.repetitions, {
    exact: true,
  }),
  doneAt: Schema.optionalWith(Schema.Date, { exact: true }),
});
