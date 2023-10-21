import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ZodError } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getErrorMessage = (error: unknown) => {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "unhandled error";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "unhandled error";
};

type PluralizeProps = {
  count: number;
  noun: string;
  suffix?: string;
};

export const pluralize = ({ count, noun, suffix = "s" }: PluralizeProps) => {
  return `${noun}${count !== 1 ? suffix : ""}`;
};
