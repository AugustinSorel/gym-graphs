import { SetSuccessSchema } from "#/set/schemas";
import { TagSchema, TagSuccessSchema } from "#/tag/schemas";
import { pipe, Schema } from "effect";

export const ExerciseSchema = Schema.Struct({
  id: Schema.Positive,
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
});

export const ExerciseSuccess = ExerciseSchema.pick("id", "name");

export const CreateExercisePayload = Schema.extend(
  Schema.Struct({
    tagIds: TagSchema.fields.id.pipe(Schema.Array, Schema.maxItems(100)),
  }),
  ExerciseSchema.pick("name"),
);

export const SelectAllExercisesUrlParams = Schema.Struct({
  name: Schema.optionalWith(Schema.String, {
    exact: true,
  }),
  tags: Schema.optionalWith(
    Schema.Array(TagSchema.fields.name).pipe(Schema.maxItems(200)),
    { exact: true },
  ),
  cursor: Schema.optionalWith(Schema.NumberFromString, {
    exact: true,
  }),
});

export const SelectAllExercisesSuccess = Schema.Struct({
  nextCursor: Schema.NullOr(Schema.Positive),
  exercises: Schema.Struct({
    id: ExerciseSchema.fields.id,
    name: ExerciseSchema.fields.name,
    sets: SetSuccessSchema.pipe(Schema.Array),
    tags: Schema.Array(TagSuccessSchema),
  }).pipe(Schema.Array),
});

export const ReorderExercisesPayload = Schema.Struct({
  exerciseIds: ExerciseSchema.fields.id.pipe(
    Schema.Array,
    Schema.maxItems(100),
  ),
});

export const ReorderExercisesSuccess = ExerciseSuccess.pipe(Schema.Array);

export const PatchExercisePayload = ExerciseSchema.pick("name");

export const PutExerciseTagsPayload = Schema.Struct({
  tagIds: TagSchema.fields.id.pipe(Schema.Array, Schema.maxItems(100)),
});

export const StatsSuccess = Schema.Struct({
  totalWeightInG: Schema.NonNegativeInt,
  totalRepetitions: Schema.NonNegativeInt,
  exerciseWithMostSets: Schema.NullOr(
    Schema.Struct({ name: Schema.String }),
  ),
  exerciseWithLeastSets: Schema.NullOr(
    Schema.Struct({ name: Schema.String }),
  ),
  setCountPerExercise: Schema.Array(
    Schema.Struct({
      name: Schema.String,
      count: Schema.NonNegativeInt,
    }),
  ),
  setCountPerTag: Schema.Array(
    Schema.Struct({
      id: Schema.Positive,
      name: Schema.String,
      count: Schema.NonNegativeInt,
    }),
  ),
  allSets: Schema.Array(
    Schema.Struct({ doneAt: Schema.Date }),
  ),
});
