import type { User } from "~/features/db/db.schemas";
import { fetchExercisesAction } from "./exercise.actions";
import { queryOptions } from "@tanstack/react-query";

export const exerciseKeys = {
  all: (userId: User["id"]) => {
    return queryOptions({
      queryKey: ["exercises", userId],
      queryFn: () => fetchExercisesAction(),
    });
  },
};
