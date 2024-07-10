"use client";

import { api } from "@/trpc/react";
import { useDashboardSearchParams } from "./useDashboardSearchParams";

//TODO: remove the select
export const useExercises = () => {
  const dashboardShareParams = useDashboardSearchParams();

  const [exercises] = api.exercise.all.useSuspenseQuery(undefined, {
    select: (exercises) => {
      return exercises.filter((exercise) => {
        return (
          exercise.name
            .toLowerCase()
            .startsWith(dashboardShareParams.exerciseName) &&
          (!dashboardShareParams.muscleGroups.length ||
            exercise.muscleGroups.some((muscleGroup) =>
              dashboardShareParams.muscleGroups.includes(muscleGroup),
            ))
        );
      });
    },
  });

  return exercises;
};
