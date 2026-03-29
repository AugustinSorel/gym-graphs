import { ExerciseSchema } from "#/exercise/schemas";
import { TagSchema } from "#/tag/schemas";
import { SetSuccessSchema } from "#/set/schemas";
import { TagSuccessSchema } from "#/tag/schemas";
import { pipe, Schema } from "effect";

export const DashboardTileTypeSchema = Schema.Literal(
  "exercise",
  "exerciseSetCount",
  "exerciseTagCount",
  "dashboardHeatMap",
  "dashboardFunFacts",
);

const DashboardTileBaseSchema = Schema.Struct({
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

export const DashboardTileSchema = Schema.Struct({
  ...DashboardTileBaseSchema.fields,
  type: DashboardTileTypeSchema,
  exerciseId: Schema.NullOr(ExerciseSchema.fields.id),
});

export const CreateDashboardTilePayload = Schema.extend(
  Schema.Struct({
    tagIds: TagSchema.fields.id.pipe(Schema.Array, Schema.maxItems(100)),
  }),
  DashboardTileSchema.pick("type", "name"),
);

export const DashboardTileSuccess = DashboardTileSchema.pick(
  "id",
  "type",
  "name",
  "exerciseId",
);

const ExerciseTileWithSetsSuccess = Schema.Struct({
  ...DashboardTileBaseSchema.fields,
  type: Schema.Literal("exercise"),
  exerciseId: Schema.NullOr(ExerciseSchema.fields.id),
  exercise: Schema.NullOr(
    Schema.Struct({
      id: ExerciseSchema.fields.id,
      sets: SetSuccessSchema.pipe(Schema.Array),
    }),
  ),
  tags: Schema.Array(Schema.Struct({ tag: TagSuccessSchema })),
});

const ExerciseSetCountTileSuccess = Schema.Struct({
  ...DashboardTileBaseSchema.fields,
  type: Schema.Literal("exerciseSetCount"),
  exercise: Schema.NullOr(
    Schema.Struct({
      sets: SetSuccessSchema.pipe(Schema.Array),
    }),
  ),
});

const ExerciseTagCountTileSuccess = Schema.Struct({
  ...DashboardTileBaseSchema.fields,
  type: Schema.Literal("exerciseTagCount"),
  tags: Schema.Struct({
    tag: TagSuccessSchema.pipe(Schema.Array),
  }).pipe(Schema.Array),
});

const DashboardHeatMapTileSuccess = Schema.Struct({
  ...DashboardTileBaseSchema.fields,
  type: Schema.Literal("dashboardHeatMap"),
});

const DashboardFunFactsTileSuccess = Schema.Struct({
  ...DashboardTileBaseSchema.fields,
  type: Schema.Literal("dashboardFunFacts"),
});

export const DashboardTileWithSetsSuccess = Schema.Union(
  ExerciseTileWithSetsSuccess,
  ExerciseSetCountTileSuccess,
  ExerciseTagCountTileSuccess,
  DashboardHeatMapTileSuccess,
  DashboardFunFactsTileSuccess,
);

export const SelectAllDashboardTilesUrlParams = Schema.Struct({
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

export const SelectAllDashboardTilesSuccess = Schema.Struct({
  nextCursor: Schema.NullOr(Schema.Positive),
  dashboardTiles: DashboardTileWithSetsSuccess.pipe(Schema.Array),
});

export const ReorderDashboardTilesPayload = Schema.Struct({
  tileIds: DashboardTileSchema.fields.id.pipe(
    Schema.Array,
    Schema.maxItems(100),
  ),
});

export const ReorderDashboardTilesSuccess = DashboardTileSuccess.pipe(
  Schema.Array,
);

export const PatchDashboardTilePayload = DashboardTileSchema.pick("name");

export const SetTileTagsPayload = Schema.Struct({
  tagIds: TagSchema.fields.id.pipe(Schema.Array, Schema.maxItems(100)),
});
