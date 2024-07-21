import { teamSchema } from "@/schemas/team.schemas";
import type { z } from "zod";

export const teamPageParamsSchema = teamSchema.pick({ id: true });
export type TeamPageParamsSchema = z.infer<typeof teamPageParamsSchema>;
