import { queryOptions } from "@tanstack/react-query";
import type { Exercise } from "@gym-graphs/api/db";
import { api, parseJsonResponse } from "~/libs/api";

const get = (exerciseId: Exercise["id"]) => {
  return queryOptions({
    queryKey: ["exercises", exerciseId],
    queryFn: async ({ signal }) => {
      const req = api().exercises[":exerciseId"].$get;

      const exercise = await parseJsonResponse(
        req(
          { param: { exerciseId: exerciseId.toString() } },
          { init: { signal } },
        ),
      );

      return {
        ...exercise,
        sets: exercise.sets.map((s) => ({
          ...s,
          doneAt: new Date(s.doneAt),
        })),
      };
    },
  });
};

export const exerciseQueries = {
  get,
};
