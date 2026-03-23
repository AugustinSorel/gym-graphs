import { queryOptions } from "@tanstack/react-query";
import { callApi } from "~/libs/api";

const all = queryOptions({
  queryKey: ["tags"],
  queryFn: async () => {
    return callApi((api) => api.Tag.all());
  },
});

export const tagQueries = {
  all,
};
