import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useUser } from "~/context/user.context";
import { exerciseKeys } from "~/exercise/exercise.keys";

const routeApi = getRouteApi("/exercises/$exerciseId");

export const useExercise = () => {
  const user = useUser();
  const params = routeApi.useParams();

  const key = exerciseKeys.get(user.id, params.exerciseId);
  const exercise = useSuspenseQuery(key);

  return exercise;
};
