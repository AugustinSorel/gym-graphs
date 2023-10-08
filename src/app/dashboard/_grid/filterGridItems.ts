import type { Exercise } from "@/db/types";

export type SearchParams = { tags: string; search: string } | undefined;

export const filterGridItems = <T extends Exercise[]>(
  exercises: T,
  searchParams: SearchParams
) => {
  if (!searchParams) {
    return exercises;
  }

  const muscleGroups = searchParams.tags ? searchParams.tags.split(",") : [];
  const exerciseName = searchParams.search;

  if (muscleGroups.length < 1 && !exerciseName) {
    return exercises;
  }

  return exercises
    .filter(
      (exercise) =>
        muscleGroups.length < 1 ||
        exercise.muscleGroups.some((muscleGroup) =>
          muscleGroups.includes(muscleGroup)
        )
    )
    .filter(
      (exercise) =>
        !exerciseName ||
        exercise.name.toLowerCase().startsWith(exerciseName.toLowerCase())
    ) as T;
};
