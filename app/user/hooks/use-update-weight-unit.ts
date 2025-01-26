import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWeightUnitAction } from "~/user/user.actions";
import { userKey } from "../user.key";

export const useUpdateWeightUnit = () => {
  const queryClient = useQueryClient();

  const updateWeightUnit = useMutation({
    mutationFn: updateWeightUnitAction,
    onMutate: (variables) => {
      queryClient.setQueryData(userKey.get.queryKey, (user) => {
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
      void queryClient.invalidateQueries(userKey.get);
    },
  });

  return updateWeightUnit;
};
