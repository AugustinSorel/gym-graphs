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
  const weightUnit = useWeightUnit();
  const [datesFilter, setDatesFilter] = useState({
    from: searchParams.values.from,
    to: searchParams.values.to,
  });

  props.exercise.data = props.exercise.data.map((d) => {
    return {
      ...d,
      weightLifted: convertWeight(d.weightLifted, weightUnit.get),
    };
  });

  const filterExerciseData = useFilterExerciseData(datesFilter);

  return (
    <ExercisePageContext.Provider
      value={{
        filter: setDatesFilter,
        exercise: {
          ...props.exercise,
          filteredData: props.exercise.data.filter(filterExerciseData),
        },
      }}
      {...props}
    />
  );
};

const useFilterExerciseData = (
  dates: Pick<ExercisePageSearchParams, "from" | "to">,
) => {
  return (exerciseData: RouterOutputs["exercise"]["get"]["data"][number]) => {
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
