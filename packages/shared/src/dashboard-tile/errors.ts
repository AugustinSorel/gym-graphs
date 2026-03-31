import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

export class DuplicateDashboardTile extends Schema.TaggedError<DuplicateDashboardTile>()(
  "DuplicateDashboardTile",
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 409 }),
) {
  static withName(name: string) {
    return new DuplicateDashboardTile({
      message: `Dashboard Tile with name ${name} already exists`,
    });
  }
}

export class DashboardTileNotFound extends Schema.TaggedError<DashboardTileNotFound>()(
  "DashboardTileNotFound",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Dashboard tile not found.",
    }),
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}
