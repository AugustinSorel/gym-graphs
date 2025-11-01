import { queryOptions } from "@tanstack/react-query";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";
import type { Exercise } from "@gym-graphs/db/schemas";

const get = (exerciseId: Exercise["id"]) => {
  return queryOptions({
    queryKey: ["exercises", exerciseId],
    queryFn: async ({ signal }) => {
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
