import { TagSchema } from "#/tag/schemas";
import { pipe, Schema } from "effect";

export const DashboardTileSchema = Schema.Struct({
  id: Schema.Positive,
  type: Schema.Literal("exercise"),
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
