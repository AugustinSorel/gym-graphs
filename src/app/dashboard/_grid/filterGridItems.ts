import type { Exercise } from "@/db/types";

export const filterGridItems = <T extends Exercise[]>(
  exercises: T,
  muscleGroups: string[]
) => {
  if (muscleGroups.length < 1) {
    return exercises;
  }

  return exercises.filter((exercise) =>
    exercise.muscleGroups.some((muscleGroup) =>
      muscleGroups.includes(muscleGroup)
    )
  ) as T;
};
