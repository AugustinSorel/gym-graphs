import { selectExerciseAction } from "~/exercise/exercise.actions";
import { queryOptions } from "@tanstack/react-query";
import type { Exercise } from "~/db/db.schemas";

const get = (exerciseId: Exercise["id"]) => {
  return queryOptions({
    queryKey: ["exercises", exerciseId],
    queryFn: ({ signal }) => {
      return selectExerciseAction({ data: { exerciseId }, signal });
    },
  });
};

export const exerciseQueries = {
  get,
} as const;
