import { useMemo } from "react";
import { useUser } from "~/domains/user/hooks/use-user";
import { calculateOneRepMax } from "~/domains/set/set.utils";
import type { Set } from "@gym-graphs/api/db";
import type { Serialize } from "~/utils/json";

export const useBestSetsFromDoneAt = <
  TSet extends Pick<Serialize<Set>, "doneAt" | "weightInKg" | "repetitions">,
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
  }, [setsByDoneAt, user.data.oneRepMaxAlgo]);
};
