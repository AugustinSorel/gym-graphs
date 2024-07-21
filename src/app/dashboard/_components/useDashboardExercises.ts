import { useDashboardSearchParams } from "./useDashboardSearchParams";
import { useExercises } from "./useExercises";

export const useDashboardExercises = () => {
  const params = useDashboardSearchParams();

  return useExercises({
    select: (exercises) => {
      return exercises.filter((exercise) => {
        return (
          exercise.name.toLowerCase().startsWith(params.exerciseName) &&
          (!params.muscleGroups.length ||
            exercise.muscleGroups.some((muscleGroup) =>
              params.muscleGroups.includes(muscleGroup),
            ))
        );
      });
    },
  });
};
