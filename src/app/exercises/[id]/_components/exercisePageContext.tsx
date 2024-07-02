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
import type { ExerciseData, ExerciseWithData } from "@/server/db/types";
import { convertWeight } from "@/lib/math";
import { useWeightUnit } from "@/context/weightUnit";

const ExercisePageContext = createContext<
  | {
      exercise: RouterOutputs["exercise"]["get"] & {
        filteredData: Array<ExerciseData>;
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
  props: PropsWithChildren & { exercise: ExerciseWithData },
) => {
  const searchParams = useExercisePageSearchParams();
  const weightUnit = useWeightUnit();
  const [datesFilter, setDatesFilter] = useState({
    from: searchParams.values.from,
    to: searchParams.values.to,
  });

  //TODO:clean this crap
  return (
    <ExercisePageContext.Provider
      value={{
        filter: setDatesFilter,
        exercise: {
          ...props.exercise,
          data: props.exercise.data.map((d) => {
            return {
              ...d,
              weightLifted: convertWeight(d.weightLifted, weightUnit.get),
            };
          }),
          filteredData: props.exercise.data
            .filter((d) => {
              if (datesFilter.from && !datesFilter.to) {
                return (
                  new Date(datesFilter.from).getTime() <=
                  new Date(d.doneAt).getTime()
                );
              }

              if (!datesFilter.from && datesFilter.to) {
                return (
                  new Date(datesFilter.to).getTime() >=
                  new Date(d.doneAt).getTime()
                );
              }

              if (datesFilter.from && datesFilter.to) {
                return (
                  new Date(datesFilter.from).getTime() <=
                    new Date(d.doneAt).getTime() &&
                  new Date(datesFilter.to).getTime() >=
                    new Date(d.doneAt).getTime()
                );
              }

              return true;
            })
            .map((d) => {
              return {
                ...d,
                weightLifted: convertWeight(d.weightLifted, weightUnit.get),
              };
            }),
        },
      }}
      {...props}
    />
  );
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
