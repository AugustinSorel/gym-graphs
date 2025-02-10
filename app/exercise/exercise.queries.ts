import { selectExerciseAction } from "~/exercise/exercise.actions";
import { queryOptions } from "@tanstack/react-query";
import type { Exercise } from "~/db/db.schemas";

const get = (exerciseId: Exercise["id"]) => {
  return queryOptions({
    queryKey: ["exercises", exerciseId],
    queryFn: () => selectExerciseAction({ data: { exerciseId } }),
  });
};

export const exerciseQueries = {
  get,
} as const;
