import { useMemo } from "react";
import { useBestSetsFromDoneAt } from "~/set/hooks/use-best-sets-from-done-at";
import { useSetsByDoneAt } from "~/set/hooks/use-sets-by-done-at";
import { useSortSetsByDoneAt } from "~/set/hooks/use-sort-sets-by-done-at";
import type { Set } from "~/db/db.schemas";

export const useBestSortedSets = <
  TSet extends Pick<Set, "doneAt" | "weightInKg" | "repetitions">,
>(
  sets: Array<TSet>,
) => {
  const setsByDoneAt = useSetsByDoneAt(sets);
  const bestSetsPerDoneAt = useBestSetsFromDoneAt(setsByDoneAt);
  const sortedBestSets = useSortSetsByDoneAt(bestSetsPerDoneAt);

  return useMemo(() => sortedBestSets, [sortedBestSets]);
};
