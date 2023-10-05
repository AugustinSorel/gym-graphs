import type { InferSelectModel } from "drizzle-orm";
import type { exercises, exercisesData, users, exercisesTag } from "./schema";

export type Exercise = InferSelectModel<typeof exercises>;
export type ExerciseData = InferSelectModel<typeof exercisesData>;
export type User = InferSelectModel<typeof users>;
export type ExerciseTag = InferSelectModel<typeof exercisesTag>;
