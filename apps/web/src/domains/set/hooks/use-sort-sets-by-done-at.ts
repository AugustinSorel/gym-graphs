import { useMemo } from "react";
import type { Set } from "@gym-graphs/api";
import { Serialize } from "~/utils/json";

export const useSortSetsByDoneAt = <
  TSet extends Pick<Serialize<Set>, "doneAt">,
>(
  sets: ReadonlyArray<TSet>,
) => {
  return useMemo(() => {
    return sets.toSorted((a, b) => {
      return new Date(a.doneAt).getTime() - new Date(b.doneAt).getTime();
    });
  }, [sets]);
};
