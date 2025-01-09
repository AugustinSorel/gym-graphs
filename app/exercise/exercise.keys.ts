import type { Exercise, User } from "~/db/db.schemas";
import { fetchExerciseAction, fetchExercisesAction } from "./exercise.actions";
import { queryOptions } from "@tanstack/react-query";

const all = (userId: User["id"]) => {
  return queryOptions({
    queryKey: ["exercises", userId],
    queryFn: () => fetchExercisesAction(),
  });
};

const get = (userId: Exercise["userId"], exerciseId: Exercise["id"]) => {
  return queryOptions({
    queryKey: [userId, "exercises", exerciseId],
    queryFn: () => fetchExerciseAction({ data: { exerciseId } }),
  });
};

export const exerciseKeys = {
  all,
  get,
};
