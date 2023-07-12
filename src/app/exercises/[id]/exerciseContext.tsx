"use client";

import type { Exercise, ExerciseData } from "@/fakeData";
import { keepDataFrom30Days } from "@/lib/date";
import { createContext, useContext, useState } from "react";
import type { PropsWithChildren } from "react";

type ExerciseContext = {
  filteredData: ExerciseData[];
  setFilteredData: (data: ExerciseData[]) => void;
} & Exercise;

const ExerciseContext = createContext<ExerciseContext | null>(null);

type ExerciseProviderProps = { exercise: Exercise } & PropsWithChildren;

export const ExerciseProvider = ({
  children,
  exercise,
}: ExerciseProviderProps) => {
  const [filteredData, setFilteredData] = useState(
    keepDataFrom30Days(exercise.data)
  );

  return (
    <ExerciseContext.Provider
      value={{ ...exercise, filteredData, setFilteredData }}
    >
      {children}
    </ExerciseContext.Provider>
  );
};

export const useExercise = () => {
  const currentExerciseContext = useContext(ExerciseContext);

  if (!currentExerciseContext) {
    throw new Error(
      "useExercuse has to be used within <ExerciseProvider.Provider>"
    );
  }

  return currentExerciseContext;
};
