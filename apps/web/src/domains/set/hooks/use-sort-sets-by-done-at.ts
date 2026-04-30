import { useMemo } from "react";

export const useSortSetsByDoneAt = <TSet extends { doneAt: Date | string }>(
  sets: ReadonlyArray<TSet>,
  sortBy: "asc" | "desc" = "asc",
) => {
  return useMemo(() => {
    return sets.toSorted((a, b) => {
      if (sortBy === "asc") {
        return new Date(a.doneAt).getTime() - new Date(b.doneAt).getTime();
      }

      return new Date(b.doneAt).getTime() - new Date(a.doneAt).getTime();
    });
  }, [sets, sortBy]);
};
