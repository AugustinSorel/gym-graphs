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

const tags = (exerciseId: Exercise["id"]) =>
  queryOptions({
    queryKey: ["exercises", exerciseId, "tags"],
    queryFn: async () => {
      return callApi((api) => api.Exercise.getTags({ path: { exerciseId } }));
    },
  });

export const exerciseQueries = {
  get,
  tags,
};
