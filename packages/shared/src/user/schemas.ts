import { pipe, Schema } from "effect";

export const UserSchema = Schema.Struct({
  id: Schema.Positive,

  email: pipe(
    Schema.Trim.annotations({
      message: () => "email must be a valid string",
    }),
    Schema.nonEmptyString({ message: () => "email is required" }),
    Schema.minLength(3, {
      message: () => "email must be at least 3 characters",
    }),
    Schema.maxLength(255, {
      message: () => "email must be at most 255 characters",
    }),
    Schema.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
      description: "a valid email address",
      message: () => "email must be valid",
    }),
  ),

  password: pipe(
    Schema.Trim.annotations({
      message: () => "password must be a valid string",
    }),
    Schema.nonEmptyString({ message: () => "password is required" }),
    Schema.minLength(3, {
      message: () => "password must be at least 3 characters",
    }),
    Schema.maxLength(255, {
      message: () => "password must be at most 255 characters",
    }),
  ),

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

  verifiedAt: Schema.NullOr(Schema.Date),

  weightUnit: Schema.Literal("kg", "lbs"),

  oneRepMaxAlgo: Schema.Literal(
    "adams",
    "baechle",
    "berger",
    "brown",
    "brzycki",
    "epley",
    "kemmler",
    "landers",
    "lombardi",
    "mayhew",
    "naclerio",
    "oConner",
    "wathen",
  ),

  dashboardView: Schema.Literal("graph", "trending"),
});

export const PatchUserByIdPayload = UserSchema.pick(
  "weightUnit",
  "oneRepMaxAlgo",
  "name",
  "dashboardView",
).pipe(Schema.partial);

export const SetExportSchema = Schema.Struct({
  id: Schema.Int,
  weightInKg: Schema.Int,
  repetitions: Schema.Int,
  doneAt: Schema.DateFromString,
  createdAt: Schema.DateFromString,
});

export const ExerciseExportSchema = Schema.Struct({
  id: Schema.Int,
  name: Schema.String,
  tags: Schema.Array(Schema.String),
  sets: Schema.Array(SetExportSchema),
});

export const UserDataExportSchema = Schema.Struct({
  user: UserSchema.pick("id", "email", "name", "weightUnit", "oneRepMaxAlgo"),
  exercises: Schema.Array(ExerciseExportSchema),
});
