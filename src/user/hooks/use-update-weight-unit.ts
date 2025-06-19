import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWeightUnitAction } from "~/user/user.actions";
import { userQueries } from "~/user/user.queries";

export const useUpdateWeightUnit = () => {
  const queryClient = useQueryClient();

  const updateWeightUnit = useMutation({
    mutationFn: updateWeightUnitAction,
    onMutate: (variables) => {
      queryClient.setQueryData(userQueries.get.queryKey, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          weightUnit: variables.data.weightUnit,
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries(userQueries.get);
    },
  });

  return updateWeightUnit;
};
