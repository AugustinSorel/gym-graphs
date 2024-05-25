import { z } from "zod";

export const exercisePageSearchParamsSchema = z.object({
  from: z.string().date().nullish(),
  to: z.string().date().nullish(),
});

export type ExercisePageSearchParams = z.infer<
  typeof exercisePageSearchParamsSchema
>;
