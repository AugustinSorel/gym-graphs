import { z } from "zod";

export const weightUnitSchema = z.enum(["lbs", "kg"]);

export type WeightUnit = z.infer<typeof weightUnitSchema>;
