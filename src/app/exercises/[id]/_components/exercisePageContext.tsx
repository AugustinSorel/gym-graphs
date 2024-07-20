"use client";

import { type RouterOutputs } from "@/trpc/react";
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useExercisePageSearchParams } from "./useExercisePageSearchParams";
import { convertWeight } from "@/lib/math";
import { useWeightUnit } from "@/context/weightUnit";
import type { ExercisePageSearchParams } from "./exercisePageSearchParams";

const ExercisePageContext = createContext<
  | {
      exercise: RouterOutputs["exercise"]["get"] & {
        filteredData: RouterOutputs["exercise"]["get"]["data"];
      };
      filter: Dispatch<
        SetStateAction<{
          from: string | null | undefined;
          to: string | null | undefined;
        }>
      >;
    }
  | undefined
>(undefined);

export const ExercisePageContextProvider = (
  props: PropsWithChildren & { exercise: RouterOutputs["exercise"]["get"] },
) => {
  const searchParams = useExercisePageSearchParams();
  const [datesFilter, setDatesFilter] = useState({
    from: searchParams.values.from,
    to: searchParams.values.to,
  });

  const convertExerciseWeight = useConvertExerciseWeight();
  const injectFilteredData = useInjectFilteredData();

  const exercise = injectFilteredData(
    convertExerciseWeight(props.exercise),
    datesFilter,
  );

  return (
    <ExercisePageContext.Provider
      value={{ filter: setDatesFilter, exercise }}
      {...props}
    />
  );
};

const useInjectFilteredData = () => {
  return (
    exercise: RouterOutputs["exercise"]["get"],
    dates: Pick<ExercisePageSearchParams, "to" | "from">,
  ) => {
    return {
      ...exercise,
      filteredData: exercise.data.filter((exerciseData) => {
        const fromTime = dates.from ? new Date(dates.from).getTime() : null;
        const toTime = dates.to ? new Date(dates.to).getTime() : null;
        const doneAtTime = new Date(exerciseData.doneAt).getTime();

        if (fromTime && !toTime) {
          return fromTime <= doneAtTime;
        }

        if (!fromTime && toTime) {
          return toTime >= doneAtTime;
        }

        if (fromTime && toTime) {
          return fromTime <= doneAtTime && toTime >= doneAtTime;
        }

        return true;
      }),
    };
  };
};

const useConvertExerciseWeight = () => {
  const weightUnit = useWeightUnit();

  return (exercise: RouterOutputs["exercise"]["get"]) => {
    return {
      ...exercise,
      data: exercise.data.map((exerciseData) => ({
        ...exerciseData,
        weightLifted: convertWeight(exerciseData.weightLifted, weightUnit.get),
      })),
    };
  };
};

export const useExercisePageContext = () => {
  const ctx = useContext(ExercisePageContext);

  if (!ctx) {
    throw new Error(
      "useExercisePageContext must be inside of a ExercisePageContextProvider",
    );
  }

  return ctx;
};
