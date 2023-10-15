import { exercisesData } from "@/db/schema";
import { and, gte, lte } from "drizzle-orm";
import type { ExercisePageProps } from "./parseExercisePageProps";

export const whereDoneAtIsBetweenDates = (
  dates: ExercisePageProps["searchParams"]
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
