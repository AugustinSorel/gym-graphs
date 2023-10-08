import type { InferSelectModel } from "drizzle-orm";
import type { exercises, exercisesData, users } from "./schema";

export type Exercise = InferSelectModel<typeof exercises>;
export type ExerciseData = InferSelectModel<typeof exercisesData>;
export type User = InferSelectModel<typeof users>;

export type ExerciseWithData = Exercise & { data: ExerciseData[] };
