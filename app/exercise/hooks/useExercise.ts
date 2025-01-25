import { useSuspenseQuery } from "@tanstack/react-query";
import { useUser } from "~/user/hooks/use-user";
import { exerciseKeys } from "~/exercise/exercise.keys";
import type { Exercise } from "~/db/db.schemas";

export const useExercise = (props: Pick<Exercise, "id">) => {
  const user = useUser();

  const key = exerciseKeys.get(user.data.id, props.id);
  const exercise = useSuspenseQuery(key);

  return exercise;
};
