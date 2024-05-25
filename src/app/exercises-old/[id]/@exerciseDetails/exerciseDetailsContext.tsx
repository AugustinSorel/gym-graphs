"use client";

import { useWeightUnit } from "@/context/weightUnit";
import type { ExerciseData, ExerciseWithData } from "@/db/types";
import { convertWeightToLbs } from "@/lib/math";
import { useSearchParams } from "next/navigation";
import { createContext, useContext, useLayoutEffect, useState } from "react";
import type { PropsWithChildren } from "react";

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
  const filterExercise = useFilterExercise();
  const convertExerciseData = useConvertExerciseData();

  const convertedData = exercise.data.map(convertExerciseData.convert);

  return (
    <ExerciseDetailsContext.Provider
      value={{
        exercise: {
          ...exercise,
          data: convertedData,
          filteredData: convertedData.filter(filterExercise.filter),
        },
        filter: filterExercise.setFilterDates,
      }}
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

const useConvertExerciseData = () => {
  const weightUnit = useWeightUnit();

  const convert = (exerciseData: ExerciseData) => {
    return {
      ...exerciseData,
      weightLifted: convertWeightToLbs(
        exerciseData.weightLifted,
        weightUnit.get,
      ),
    };
  };

  return { convert };
};

const useFilterExercise = () => {
  const [filterDates, setFilterDates] = useState<FilterDates>({
    from: null,
    to: null,
  });

  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dates: FilterDates = {
      from: from ? new Date(from) : null,
      to: to ? new Date(to) : null,
    };

    setFilterDates(dates);
  }, [searchParams]);

  const filter = (exerciseData: ExerciseData) => {
    if (filterDates.from && !filterDates.to) {
      return (
        filterDates.from.getTime() <= new Date(exerciseData.doneAt).getTime()
      );
    }

    if (!filterDates.from && filterDates.to) {
      return (
        filterDates.to.getTime() >= new Date(exerciseData.doneAt).getTime()
      );
    }

    if (filterDates.from && filterDates.to) {
      return (
        filterDates.from.getTime() <= new Date(exerciseData.doneAt).getTime() &&
        filterDates.to.getTime() >= new Date(exerciseData.doneAt).getTime()
      );
    }

    return true;
  };

  return { filter, setFilterDates };
};
