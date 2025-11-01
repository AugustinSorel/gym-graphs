import { queryOptions } from "@tanstack/react-query";
import { parseJsonResponse } from "@gym-graphs/api";
import { api } from "~/libs/api";

const get = queryOptions({
  queryKey: ["session"],
  queryFn: async ({ signal }) => {
    const req = api().sessions.me.$get(undefined, { init: { signal } });

    return parseJsonResponse(req);
  },
});

export const userQueries = {
  get,
};
