import { z } from "zod";

export const themeSchema = z.enum(["dark", "light", "system"]);

export type Theme = z.infer<typeof themeSchema>;
