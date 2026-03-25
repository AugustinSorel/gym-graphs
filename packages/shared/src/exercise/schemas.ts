import { Schema } from "effect";
// import { DashboardTileSuccess } from "#/dashboard-tile/schemas";

export const ExerciseSchema = Schema.Struct({
  id: Schema.Positive,
});

export const ExerciseSuccessSchema = Schema.extend(
  ExerciseSchema.pick("id"),
  Schema.Struct({
    // dashboardTile: DashboardTileSuccess,
  }),
);
