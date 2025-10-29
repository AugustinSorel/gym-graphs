import { queryOptions } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { api } from "~/libs/api";

const get = queryOptions({
  queryKey: ["session"],
  queryFn: async ({ signal }) => {
    const req = api().sessions.me.$get(undefined, { init: { signal } });

    return parseResponse(req);
  },
});

export const userQueries = {
  get,
};
