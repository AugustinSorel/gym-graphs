import type { Set } from "@gym-graphs/shared/set/schemas";
import { useMemo } from "react";
import { exceedsOneRepMax } from "~/domains/set/set.utils";
import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";
import { Mutable } from "effect/Types";

export const useProgressivePrs = (
  sets: ReadonlyArray<Set>,
): ReadonlyArray<Set> => {
  const sorted = useSortSetsByDoneAt(sets);

  return useMemo(
    () =>
      sorted.reduce<Mutable<Array<Set>>>((prs, candidateSet) => {
        const currentPr = prs.at(-1);

        if (!currentPr) {
          prs.push(candidateSet);
          return prs;
        }

        if (exceedsOneRepMax(currentPr, candidateSet)) {
          prs.push(candidateSet);
        }

        return prs;
      }, []),
    [sorted],
  );
};
