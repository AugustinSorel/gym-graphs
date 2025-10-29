import { z } from "zod";

export const themeSchema = z.enum(["dark", "light", "system"]);

export type Theme = Readonly<z.infer<typeof themeSchema>>;
