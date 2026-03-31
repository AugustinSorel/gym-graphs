import { useMutation } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { callApi, InferApiProps } from "~/libs/api";

export const useUpdateWeightUnit = () => {
  const queries = {
    user: userQueries.get,
  };

  const updateWeightUnit = useMutation({
    mutationFn: async (
      payload: Pick<InferApiProps<"User", "patch">["payload"], "weightUnit">,
    ) => {
      return callApi((api) => api.User.patch({ payload }));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.user);

      const oldUser = ctx.client.getQueryData(queries.user.queryKey);

      ctx.client.setQueryData(queries.user.queryKey, (user) => {
        if (!user || !variables.weightUnit) {
          return user;
        }
        return {
          ...user,
          weightUnit: variables.weightUnit,
        };
      });

      return {
        oldUser,
      };
    },
    onError: (_e, _variables, onMutateResult, ctx) => {
      ctx.client.setQueryData(queries.user.queryKey, onMutateResult?.oldUser);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.user);
    },
  });

  return updateWeightUnit;
};
