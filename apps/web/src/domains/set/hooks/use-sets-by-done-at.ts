import { useMemo } from "react";
import { dateAsYYYYMMDD } from "~/utils/date";

export const useSetsByDoneAt = <TSet extends { doneAt: Date | string }>(
  sets: ReadonlyArray<TSet>,
) => {
  return useMemo(() => {
    return sets.reduce((map, set) => {
      const key = dateAsYYYYMMDD(new Date(set.doneAt));
      const existing = map.get(key);

      if (existing) {
        existing.push(set);
      } else {
        map.set(key, [set]);
      }

      return map;
    }, new Map<string, Array<TSet>>());
  }, [sets]);
};
