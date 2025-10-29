import { useMutation } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { api, parseJsonResponse } from "~/libs/api";
import type { InferRequestType } from "hono/client";

export const useUpdateWeightUnit = () => {
  const req = api().users.me.$patch;

  const updateWeightUnit = useMutation({
    mutationFn: async (
      json: Pick<InferRequestType<typeof req>["json"], "weightUnit">,
    ) => {
      return parseJsonResponse(req({ json }));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(userQueries.get);

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
