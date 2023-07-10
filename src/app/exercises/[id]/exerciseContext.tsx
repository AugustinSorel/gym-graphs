"use client";

import type { Exercise, ExerciseData } from "@/fakeData";
import { createContext, useContext, useState } from "react";
import type { PropsWithChildren } from "react";

type ExerciseContext = {
  filteredData: ExerciseData[];
  setFilteredData: (data: ExerciseData[]) => void;
} & Exercise;

const ExerciseContext = createContext<ExerciseContext | null>(null);

const keepDataFrom30Days = (data: ExerciseData[]) => {
  return data.filter((d) => {
    const dataDate = new Date(d.date);
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return dataDate >= thirtyDaysAgo && dataDate <= currentDate;
  });
};

type ExerciseProviderProps = { exercise: Exercise } & PropsWithChildren

export const ExerciseProvider = ({ children, exercise, }: ExerciseProviderProps) => {
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
