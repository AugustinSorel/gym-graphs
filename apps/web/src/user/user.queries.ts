import { queryOptions } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { api } from "~/libs/api";

const get = queryOptions({
  queryKey: ["user"],
  queryFn: async ({ signal }) => {
    return parseResponse(api.users.me.$get({}, { init: { signal } }));
  },
});

export const userQueries = {
  get,
} as const;
