import { queryOptions } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { api } from "~/libs/api";

const get = queryOptions({
  queryKey: ["session"],
  queryFn: async () => parseResponse(api.sessions.me.$get()),
});

export const userQueries = {
  get,
};
