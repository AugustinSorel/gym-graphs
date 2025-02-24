import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ClassValue } from "clsx";

export const cn = (...inputs: ReadonlyArray<ClassValue>) => {
  return twMerge(clsx(inputs));
};
