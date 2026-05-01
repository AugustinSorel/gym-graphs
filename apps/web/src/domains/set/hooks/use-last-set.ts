import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";
import type { Set } from "@gym-graphs/shared/set/schemas";

export const useLastSet = <TSet extends Pick<Set, "doneAt">>(
  sets: ReadonlyArray<TSet>,
) => {
  const sortedSets = useSortSetsByDoneAt(sets);

  const lastSet = sortedSets.at(-1);

  return lastSet;
};
