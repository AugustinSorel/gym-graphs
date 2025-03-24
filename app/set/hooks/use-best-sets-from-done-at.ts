import { useMemo } from "react";
import { useUser } from "~/user/hooks/use-user";
import { calculateOneRepMax } from "~/set/set.utils";
import type { Set } from "~/db/db.schemas";

export const useBestSetsFromDoneAt = <
  TSet extends Pick<Set, "doneAt" | "weightInKg" | "repetitions">,
>(
  setsByDoneAt: Map<string, Array<TSet>>,
) => {
  const user = useUser();

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
  }, [setsByDoneAt]);
};
