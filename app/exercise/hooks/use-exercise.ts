import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseQueries } from "~/exercise/exercise.queries";
import type { Exercise } from "~/db/db.schemas";

export const useExercise = (props: Pick<Exercise, "id">) => {
  const exercise = useSuspenseQuery(exerciseQueries.get(props.id));

  return exercise;
};
