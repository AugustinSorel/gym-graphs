import { queryOptions } from "@tanstack/react-query";
import type { Exercise } from "@gym-graphs/api/db";
import { api, parseJsonResponse } from "~/libs/api";

const get = (exerciseId: Exercise["id"]) => {
  return queryOptions({
    queryKey: ["exercises", exerciseId],
    queryFn: ({ signal }) => {
      const req = api().exercises[":exerciseId"].$get;

      return parseJsonResponse(
        req(
          { param: { exerciseId: exerciseId.toString() } },
          { init: { signal } },
        ),
      );
    },
  });
};

export const exerciseQueries = {
  get,
};
