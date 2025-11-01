import { useMemo } from "react";
import { useBestSetsFromDoneAt } from "~/domains/set/hooks/use-best-sets-from-done-at";
import { useSetsByDoneAt } from "~/domains/set/hooks/use-sets-by-done-at";
import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";
import type { Set } from "@gym-graphs/db/schemas";
import type { Serialize } from "~/utils/json";

export const useBestSortedSets = <
  TSet extends Pick<Serialize<Set>, "doneAt" | "weightInKg" | "repetitions">,
>(
  sets: Array<TSet>,
) => {
  const setsByDoneAt = useSetsByDoneAt(sets);
  const bestSetsPerDoneAt = useBestSetsFromDoneAt(setsByDoneAt);
  const sortedBestSets = useSortSetsByDoneAt(bestSetsPerDoneAt);

  return useMemo(() => sortedBestSets, [sortedBestSets]);
};
