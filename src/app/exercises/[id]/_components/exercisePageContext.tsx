"use client";

import { type RouterOutputs, api } from "@/trpc/react";
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useState,
} from "react";
import { useExercisePageParams } from "./useExercisePageParams";
import { useExercisePageSearchParams } from "./useExercisePageSearchParams";
import type { ExerciseData } from "@/db/types";
import { convertWeightToLbs } from "@/lib/math";
import { useWeightUnit } from "@/context/weightUnit";

const exercisePageContext = createContext<
  | {
      exercise: RouterOutputs["exercise"]["get"] & {
        filteredData: Array<ExerciseData>;
      };
      filter: (newParams: object) => void;
    }
  | undefined
>(undefined);

export const ExercisePageContextProvider = (props: PropsWithChildren) => {
  const params = useExercisePageParams();
  const searchParams = useExercisePageSearchParams();
  const weightUnit = useWeightUnit();
  const [x, setX] = useState(searchParams.values);

  const [exercise] = api.exercise.get.useSuspenseQuery({ id: params.id });

  if (!exercise) {
    throw new Error(`exercise with id: ${params.id} could not be found`);
  }

  //TODO:clean this crap
  return (
    <exercisePageContext.Provider
      value={{
        filter: setX,
        exercise: {
          ...exercise,
          filteredData: exercise.data
            .filter((d) => {
              if (x.from && !x.to) {
                return (
                  new Date(x.from).getTime() <= new Date(d.doneAt).getTime()
                );
              }

              if (!x.from && x.to) {
                return new Date(x.to).getTime() >= new Date(d.doneAt).getTime();
              }

              if (x.from && x.to) {
                return (
                  new Date(x.from).getTime() <= new Date(d.doneAt).getTime() &&
                  new Date(x.to).getTime() >= new Date(d.doneAt).getTime()
                );
              }

              return true;
            })
            .map((d) => {
              return {
                ...d,
                weightLifted: convertWeightToLbs(
                  d.weightLifted,
                  weightUnit.get,
                ),
              };
            }),
        },
      }}
      {...props}
    />
  );
};

export const useExercisePageContext = () => {
  const ctx = useContext(exercisePageContext);

  if (!ctx) {
    throw new Error(
      "useExercisePageContext must be inside of a ExercisePageContextProvider",
    );
  }

  return ctx;
};
