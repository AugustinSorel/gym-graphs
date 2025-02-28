import { useUser } from "~/user/hooks/use-user";
import { convertUserWeightUnitToSymbol } from "~/weight-unit/weight-unit.utils";

export const WeightUnit = () => {
  const user = useUser();

  return convertUserWeightUnitToSymbol(user.data.weightUnit);
};
