import { Schema } from "effect";

export const ThemeSchema = Schema.Literal("dark", "light", "system");

export type Theme = typeof ThemeSchema.Type;
