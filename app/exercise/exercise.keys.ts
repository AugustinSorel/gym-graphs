import {
  fetchExerciseAction,
  selectExercisesFrequencyAction,
} from "~/exercise/exercise.actions";
import { queryOptions } from "@tanstack/react-query";
import type { Exercise } from "~/db/db.schemas";

const get = (userId: Exercise["userId"], exerciseId: Exercise["id"]) => {
  return queryOptions({
    queryKey: [userId, "exercises", exerciseId],
    queryFn: () => fetchExerciseAction({ data: { exerciseId } }),
  });
};

const exercisesFrequency = (userId: Exercise["userId"]) => {
  return queryOptions({
    queryKey: [userId, "exercises", "frequency"],
    queryFn: () => selectExercisesFrequencyAction(),
  });
};

export const exerciseKeys = {
  get,
  exercisesFrequency,
} as const;
