import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { convertWeightUnitToSymbol } from "~/domains/user/user.utils";

export const WeightUnit = () => {
  const user = useSuspenseQuery(userQueries.get);

  return convertWeightUnitToSymbol(user.data.weightUnit);
};
