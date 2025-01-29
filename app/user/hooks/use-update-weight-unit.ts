import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWeightUnitAction } from "~/user/user.actions";
import { userKeys } from "../user.key";

export const useUpdateWeightUnit = () => {
  const queryClient = useQueryClient();

  const updateWeightUnit = useMutation({
    mutationFn: updateWeightUnitAction,
    onMutate: (variables) => {
      queryClient.setQueryData(userKeys.get.queryKey, (user) => {
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
      void queryClient.invalidateQueries(userKeys.get);
    },
  });

  return updateWeightUnit;
};
