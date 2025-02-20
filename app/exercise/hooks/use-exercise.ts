import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseQueries } from "~/exercise/exercise.queries";
import type { Exercise } from "~/db/db.schemas";

export const useExercise = (exerciseId: Exercise["id"]) => {
  const exercise = useSuspenseQuery(exerciseQueries.get(exerciseId));

  return exercise;
};
