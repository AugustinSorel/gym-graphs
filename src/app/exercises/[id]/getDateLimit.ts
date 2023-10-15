import { exercisesData } from "@/db/schema";
import { and, gte, lte } from "drizzle-orm";
import type { SafeExercisePageProps } from "./page";

export const whereDoneAtIsBetweenDates = (
  dates: SafeExercisePageProps["searchParams"]
) => {
  const { from, to } = dates;

  if (!from && to) {
    return lte(exercisesData.doneAt, to);
  }

  if (from && !to) {
    return gte(exercisesData.doneAt, from);
  }

  if (from && to) {
    return and(gte(exercisesData.doneAt, from), lte(exercisesData.doneAt, to));
  }
};
