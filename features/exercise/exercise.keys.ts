import type { Exercise, User } from "~/features/db/db.schemas";
import { fetchExerciseAction, fetchExercisesAction } from "./exercise.actions";
import { queryOptions } from "@tanstack/react-query";

const all = (userId: User["id"]) => {
  return queryOptions({
    queryKey: ["exercises", userId],
    queryFn: () => fetchExercisesAction(),
  });
};

const get = (userId: Exercise["userId"], name: Exercise["name"]) => {
  return queryOptions({
    queryKey: [userId, "exercises", name],
    queryFn: () => fetchExerciseAction({ data: { name } }),
  });
};

export const exerciseKeys = {
  all,
  get,
};
