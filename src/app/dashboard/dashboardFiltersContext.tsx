"use client";

import type { Exercise, ExerciseData } from "@/db/types";
import { createContext, useContext, useState } from "react";
import type { PropsWithChildren } from "react";

type DashboardFiltersContext = {
  muscleGroups: Exercise["muscleGroups"];
  setMuscleGroups: (x: Exercise["muscleGroups"]) => void;
  apply: (
    exercises: (Exercise & { data: ExerciseData[] })[]
  ) => (Exercise & { data: ExerciseData[] })[];
};

const DashboardFiltersContext = createContext<DashboardFiltersContext | null>(
  null
);

export const DashboardFiltersContextProvider = ({
  children,
}: PropsWithChildren) => {
  const [muscleGroups, setMuscleGroups] = useState<Exercise["muscleGroups"]>(
    []
  );

  const apply = (exercies: (Exercise & { data: ExerciseData[] })[]) => {
    return exercies.filter(
      (exercise) =>
        muscleGroups.length < 1 ||
        exercise.muscleGroups.some((muscleGroup) =>
          muscleGroups.includes(muscleGroup)
        )
    );
  };

  return (
    <DashboardFiltersContext.Provider
      value={{
        muscleGroups,
        setMuscleGroups,
        apply,
      }}
    >
      {children}
    </DashboardFiltersContext.Provider>
  );
};

export const useDashboardFilters = () => {
  const currentDashboardFilterContext = useContext(DashboardFiltersContext);

  if (!currentDashboardFilterContext) {
    throw new Error(
      "useWeightUnit has to be used within <WeightUnitProvider.Provider>"
    );
  }

  return currentDashboardFilterContext;
};
