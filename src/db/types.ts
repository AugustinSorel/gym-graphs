import type { InferModel } from "drizzle-orm";
import type { exercises, exercisesData, users } from "./schema";

export type Exercise = InferModel<typeof exercises>;
export type ExerciseData = InferModel<typeof exercisesData>;
export type User = InferModel<typeof users>;
