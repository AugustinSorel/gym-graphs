import { queryOptions } from "@tanstack/react-query";
import { callApi } from "~/libs/api";

const get = (exerciseId: Exercise["id"]) => {
  return queryOptions({
    queryKey: ["exercises", exerciseId],
    queryFn: async () => {
      return callApi((api) => api.Exercise.get({ path: { exerciseId } }));
    },
  });
};

export const exerciseQueries = {
  get,
};
