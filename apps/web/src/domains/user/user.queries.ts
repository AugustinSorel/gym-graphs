import { queryOptions } from "@tanstack/react-query";
import { api, parseJsonResponse } from "~/libs/api";

const get = queryOptions({
  queryKey: ["user"],
  queryFn: async () => {
    const req = api().users.me.$get();
    return parseJsonResponse(req);
  },
});

export const userQueries = {
  get,
};
