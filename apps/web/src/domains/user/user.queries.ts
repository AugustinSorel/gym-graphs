import { queryOptions } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { api } from "~/libs/api";

const get = queryOptions({
  queryKey: ["user"],
  queryFn: async () => {
    const req = api().users.me.$get();
    return parseResponse(req);
  },
});

export const userQueries = {
  get,
};
