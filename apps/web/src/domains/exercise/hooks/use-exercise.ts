import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import type { Exercise } from "@gym-graphs/api/db";

export const useExercise = (exerciseId: Exercise["id"]) => {
  const exercise = useSuspenseQuery(exerciseQueries.get(exerciseId));

  return exercise;
};
