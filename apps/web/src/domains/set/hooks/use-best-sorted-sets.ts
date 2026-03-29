import { useMemo } from "react";
import { useBestSetsFromDoneAt } from "~/domains/set/hooks/use-best-sets-from-done-at";
import { useSetsByDoneAt } from "~/domains/set/hooks/use-sets-by-done-at";
import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";

export const useBestSortedSets = <
  TSet extends { doneAt: Date | string; weightInKg: number; repetitions: number },
>(
  sets: ReadonlyArray<TSet>,
) => {
  const setsByDoneAt = useSetsByDoneAt(sets);
  const bestSetsPerDoneAt = useBestSetsFromDoneAt(setsByDoneAt);
  const sortedBestSets = useSortSetsByDoneAt(bestSetsPerDoneAt);

  return useMemo(() => sortedBestSets, [sortedBestSets]);
};
