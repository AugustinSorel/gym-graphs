import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { calculateOneRepMax } from "~/domains/set/set.utils";
import { useMemo } from "react";

export const useSortSetsByOneRepMax = <
  TSet extends { weightInG: number; repetitions: number },
>(
  sets: ReadonlyArray<TSet>,
) => {
  const user = useSuspenseQuery(userQueries.get);

  return useMemo(() => {
    return sets.toSorted((a, b) => {
      return (
        calculateOneRepMax(
          b.weightInG,
          b.repetitions,
          user.data.oneRepMaxAlgo,
        ) -
        calculateOneRepMax(a.weightInG, a.repetitions, user.data.oneRepMaxAlgo)
      );
    });
  }, [user.data.oneRepMaxAlgo]);
};
