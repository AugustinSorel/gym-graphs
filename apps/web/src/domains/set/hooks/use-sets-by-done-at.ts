import { useMemo } from "react";
import { dateAsYYYYMMDD } from "~/utils/date";
import type { Set } from "@gym-graphs/api";
import type { Serialize } from "~/utils/json";

export const useSetsByDoneAt = <TSet extends Pick<Serialize<Set>, "doneAt">>(
  sets: Array<TSet>,
) => {
  return useMemo(() => {
    return sets.reduce((map, set) => {
      const key = dateAsYYYYMMDD(new Date(set.doneAt));
      const sets = map.get(key);

      if (sets) {
        sets.push(set);
      } else {
        map.set(key, [set]);
      }

      return map;
    }, new Map<string, typeof sets>());
  }, [sets]);
};
