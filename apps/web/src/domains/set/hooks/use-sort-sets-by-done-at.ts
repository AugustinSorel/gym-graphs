import { useMemo } from "react";
import type { Set } from "@gym-graphs/api/db";

export const useSortSetsByDoneAt = <TSet extends Pick<Set, "doneAt">>(
  sets: ReadonlyArray<TSet>,
) => {
  return useMemo(() => {
    return sets.toSorted((a, b) => {
      return a.doneAt.getTime() - b.doneAt.getTime();
    });
  }, [sets]);
};
