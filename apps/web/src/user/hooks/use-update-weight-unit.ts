import { useMutation } from "@tanstack/react-query";
import { updateWeightUnitAction } from "~/user/user.actions";
import { userQueries } from "~/user/user.queries";

export const useUpdateWeightUnit = () => {
  const updateWeightUnit = useMutation({
    mutationFn: updateWeightUnitAction,
    onMutate: (variables, ctx) => {
      ctx.client.setQueryData(userQueries.get.queryKey, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          weightUnit: variables.data.weightUnit,
        };
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(userQueries.get);
    },
  });

  return updateWeightUnit;
};
