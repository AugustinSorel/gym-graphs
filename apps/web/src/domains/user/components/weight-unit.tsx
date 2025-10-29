import { useUser } from "~/domains/user/hooks/use-user";
import { convertWeightUnitToSymbol } from "~/domains/user/user.utils";

export const WeightUnit = () => {
  const user = useUser();

  return convertWeightUnitToSymbol(user.data.weightUnit);
};
