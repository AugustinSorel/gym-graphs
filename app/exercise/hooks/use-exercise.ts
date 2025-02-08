import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseKeys } from "~/exercise/exercise.keys";
import type { Exercise } from "~/db/db.schemas";

export const useExercise = (props: Pick<Exercise, "id">) => {
  const exercise = useSuspenseQuery(exerciseKeys.get(props.id));

  return exercise;
};
