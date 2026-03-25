import { ExerciseSchema } from "#/exercise/schemas";
import { TagSchema } from "#/tag/schemas";
import { pipe, Schema } from "effect";

export const DashboardTileSchema = Schema.Struct({
  id: Schema.Positive,
  type: Schema.Literal("exercise"),
  exerciseId: Schema.NullOr(ExerciseSchema.fields.id),
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
  dashboardTiles: DashboardTileSuccess.pipe(Schema.Array),
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
