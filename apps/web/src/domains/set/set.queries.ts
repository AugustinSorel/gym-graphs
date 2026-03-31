import { queryOptions } from "@tanstack/react-query";
import { callApi } from "~/libs/api";

const getAll = (exerciseId: number) => {
  return queryOptions({
    queryKey: ["exercises", exerciseId, "sets"],
    queryFn: async () => {
      return callApi((api) => api.Set.getAll({ path: { exerciseId } }));
    },
  });
};

export const setQueries = {
  getAll,
};
