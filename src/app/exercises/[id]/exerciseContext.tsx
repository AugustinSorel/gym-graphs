"use client";

import type { Exercise, ExerciseData } from "@/db/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import { useExerciseParams } from "./useExercisesParams";
import { convertWeightToLbs } from "@/lib/math";
import { useWeightUnit } from "@/context/weightUnit";

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
  const weightUnit = useWeightUnit();

  const getFilteredData = useCallback(() => {
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
  }, [exercise.data, fromDate, toDate]);

  const convertWeight = useCallback(
    (exerciseData: ExerciseData[]) => {
      return exerciseData.map((data) => ({
        ...data,
        weightLifted: convertWeightToLbs(data.weightLifted, weightUnit.get),
      }));
    },
    [weightUnit.get]
  );

  const [filteredData, setFilteredData] = useState(
    convertWeight(getFilteredData())
  );

  useEffect(() => {
    setFilteredData(convertWeight(getFilteredData()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.data, weightUnit, convertWeight]);

  return (
    <ExerciseContext.Provider
      value={{
        ...exercise,
        data: convertWeight(exercise.data),
        filteredData,
        setFilteredData,
      }}
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
