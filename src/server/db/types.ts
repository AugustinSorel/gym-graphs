import type { InferSelectModel } from "drizzle-orm";
import type {
  teams,
  exercises,
  exercisesData,
  teamInvites,
  users,
} from "./schema";

//TODO: use the outputRouter type instead
export type Exercise = InferSelectModel<typeof exercises>;
//TODO: use the outputRouter type instead
export type ExerciseData = InferSelectModel<typeof exercisesData>;
//TODO: use the outputRouter type instead
export type User = InferSelectModel<typeof users>;

//TODO: use the outputRouter type instead
export type ExerciseWithData = Exercise & { data: ExerciseData[] };

export type TeamInvite = typeof teamInvites.$inferSelect;

export type Team = typeof teams.$inferSelect;
