import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";
import type { Set } from "@gym-graphs/db/schemas";
import type { Serialize } from "~/utils/json";

export const useLastSet = <TSet extends Pick<Serialize<Set>, "doneAt">>(
  sets: ReadonlyArray<TSet>,
) => {
  const sortedSets = useSortSetsByDoneAt(sets);

  const lastSet = sortedSets.at(-1);

  return lastSet;
};
