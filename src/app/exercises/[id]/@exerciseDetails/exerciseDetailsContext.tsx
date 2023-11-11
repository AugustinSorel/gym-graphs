"use client";

import { useWeightUnit } from "@/context/weightUnit";
import type { ExerciseData, ExerciseWithData } from "@/db/types";
import { convertWeightToLbs } from "@/lib/math";
import { PropsWithChildren, createContext, useContext, useState } from "react";

type FilterDates = { from: Date | null; to: Date | null };

type ExerciseDetailsContextProps = {
  filter: (filterDates: FilterDates) => void;
  exercise: ExerciseWithData & { filteredData: ExerciseData[] };
};

const ExerciseDetailsContext =
  createContext<ExerciseDetailsContextProps | null>(null);

type ExerciseDetailsProviderProps = {
  exercise: ExerciseWithData;
} & PropsWithChildren;

export const ExerciseDetailsProvider = ({
  children,
  exercise,
}: ExerciseDetailsProviderProps) => {
  const weightUnit = useWeightUnit();

  const [filterDates, setFilterDates] = useState<FilterDates>({
    from: null,
    to: null,
  });

  const exerciseConverted = {
    ...exercise,
    data: exercise.data.map((y) => ({
      ...y,
      weightLifted: convertWeightToLbs(y.weightLifted, weightUnit.get),
    })),
  };

  const exerciseWithFilteredData: ExerciseWithData & {
    filteredData: ExerciseData[];
  } = {
    ...exerciseConverted,
    filteredData: [...exerciseConverted.data].filter((exData) => {
      const defaultValues = {
        from: new Date(exercise.data.at(0)?.doneAt ?? ""),
        to: new Date(exercise.data.at(-1)?.doneAt ?? ""),
      };

      return (
        (filterDates.from ?? defaultValues.from).getTime() <=
          new Date(exData.doneAt).getTime() &&
        (filterDates.to ?? defaultValues.to).getTime() >=
          new Date(exData.doneAt).getTime()
      );
    }),
  };

  const filter = ({ from, to }: FilterDates) => {
    setFilterDates({ from, to });
  };

  return (
    <ExerciseDetailsContext.Provider
      value={{ exercise: exerciseWithFilteredData, filter }}
    >
      {children}
    </ExerciseDetailsContext.Provider>
  );
};

export const useExerciseDetails = () => {
  const ctx = useContext(ExerciseDetailsContext);

  if (!ctx) {
    throw new Error(
      "useExerciseDetails has to be used within a ExerciseDetailsProvider",
    );
  }

  return ctx;
};
