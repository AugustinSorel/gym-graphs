import { env } from "@/env.mjs";
import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import type { User } from "next-auth";
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

export const getBaseUrl = () => {
  if (env.VERCEL_ENV === "production") {
    return `https://gym-graphs.vercel.app`;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
};

export const getUserDisplayName = (user: User) => {
  if (user.name) {
    return user.name;
  }

  const username = user.email.split("@").at(0);

  if (!username) {
    throw new Error("email is malformed, usename missing");
  }

  return username;
};
