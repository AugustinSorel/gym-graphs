import { exerciseSchema } from "@/schemas/exercise.schema";
import type { z } from "zod";

export const exercisePageParamsSchema = exerciseSchema.pick({ id: true });

export type ExercisePageParams = z.infer<typeof exercisePageParamsSchema>;
