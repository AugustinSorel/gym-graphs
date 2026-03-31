import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { calculateOneRepMax } from "~/domains/set/set.utils";

export const useBestSetsFromDoneAt = <
  TSet extends { doneAt: Date | string; weightInKg: number; repetitions: number },
>(
  setsByDoneAt: Map<string, Array<TSet>>,
) => {
  const user = useSuspenseQuery(userQueries.get);

  return useMemo(() => {
    return Array.from(setsByDoneAt).reduce<Array<TSet>>((acc, [_key, sets]) => {
      const sortedSetsByOneRepMax = sets.toSorted((a, b) => {
        return (
          calculateOneRepMax(
            b.weightInKg,
            b.repetitions,
            user.data.oneRepMaxAlgo,
          ) -
          calculateOneRepMax(
            a.weightInKg,
            a.repetitions,
            user.data.oneRepMaxAlgo,
          )
        );
      });

      const bestSet = sortedSetsByOneRepMax.at(0);

      if (bestSet) {
        acc.push(bestSet);
      }

      return acc;
    }, []);
  }, [setsByDoneAt, user.data.oneRepMaxAlgo]);
};
