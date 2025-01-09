import { useMutation } from "@tanstack/react-query";
import { updateWeightUnitAction } from "../user.actions";
import { useUser } from "~/user/user.context";

export const useUpdateWeightUnit = () => {
  const user = useUser();

  const updateWeightUnit = useMutation({
    mutationFn: updateWeightUnitAction,
    onMutate: (variables) => {
      user.set((u) => ({ ...u, weightUnit: variables.data.weightUnit }));
    },
  });

  return updateWeightUnit;
};
