"use client";

import type { Exercise, ExerciseData } from "@/db/schema";
import { createContext, useContext, useState } from "react";
import type { PropsWithChildren } from "react";
import { useExerciseParams } from "./useExercisesParams";

type ExerciseContext = {
  filteredData: ExerciseData[];
  setFilteredData: (data: ExerciseData[]) => void;
} & Exercise & { data: ExerciseData[] };

const ExerciseContext = createContext<ExerciseContext | null>(null);

type ExerciseProviderProps = {
  exercise: Exercise & { data: ExerciseData[] };
} & PropsWithChildren;

export const ExerciseProvider = ({
  children,
  exercise,
}: ExerciseProviderProps) => {
  const exerciseParams = useExerciseParams();
  const fromDate = exerciseParams.getFromDate();
  const toDate = exerciseParams.getToDate();

  const getFilteredData = () => {
    if (fromDate && !toDate) {
      return exercise.data.filter(
        (data) => new Date(data.doneAt).getTime() >= fromDate.getTime()
      );
    }

    if (!fromDate && toDate) {
      return exercise.data.filter(
        (data) => new Date(data.doneAt).getTime() <= toDate.getTime()
      );
    }

    if (fromDate && toDate && fromDate.getTime() < toDate.getTime()) {
      return exercise.data.filter(
        (data) =>
          new Date(data.doneAt).getTime() >= fromDate.getTime() &&
          new Date(data.doneAt).getTime() <= toDate.getTime()
      );
    }

    return exercise.data;
  };

  const [filteredData, setFilteredData] = useState(getFilteredData());

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
