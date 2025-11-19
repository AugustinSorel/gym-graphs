import { queryOptions } from "@tanstack/react-query";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";

const get = queryOptions({
  queryKey: ["user"],
  staleTime: 3600 * 60,
  queryFn: async () => {
    const req = api().users.me.$get();
    return parseJsonResponse(req);
  },
});

export const userQueries = {
  get,
};
