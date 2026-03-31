import { useMemo } from "react";

export const useSortSetsByDoneAt = <TSet extends { doneAt: Date | string }>(
  sets: ReadonlyArray<TSet>,
) => {
  return useMemo(() => {
    return sets.toSorted((a, b) => {
      return new Date(a.doneAt).getTime() - new Date(b.doneAt).getTime();
    });
  }, [sets]);
};
