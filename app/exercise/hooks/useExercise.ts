import { useSuspenseQuery } from "@tanstack/react-query";
import { useUser } from "~/user/user.context";
import type { Exercise } from "~/db/db.schemas";
import { exerciseKeys } from "~/exercise/exercise.keys";

export const useExercise = (props: Pick<Exercise, "id">) => {
  const user = useUser();

  const key = exerciseKeys.get(user.id, props.id);
  const exercise = useSuspenseQuery(key);

  return exercise;
};
