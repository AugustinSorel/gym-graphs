import { useMutation } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { api, parseJsonResponse } from "~/libs/api";
import type { InferRequestType } from "hono/client";

export const useUpdateWeightUnit = () => {
  const updateWeightUnit = useMutation({
    mutationFn: async (
      json: InferRequestType<typeof api.users.me.$patch>["json"],
    ) => {
      const req = api.users.me.$patch({ json });

      return parseJsonResponse(req);
    },
    onMutate: (variables, ctx) => {
      ctx.client.setQueryData(userQueries.get.queryKey, (user) => {
        if (!user || !variables.weightUnit) {
          return user;
        }

        return {
          ...user,
          weightUnit: variables.weightUnit,
        };
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(userQueries.get);
    },
  });

  return updateWeightUnit;
};
