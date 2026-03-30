import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { convertWeight } from "~/domains/user/user.utils";
import { SetSuccessSchema } from "@gym-graphs/shared/set/schemas";

export const WeightValue = (
  props: Pick<typeof SetSuccessSchema.Type, "weightInKg">,
) => {
  const user = useSuspenseQuery(userQueries.get);

  return convertWeight(props.weightInKg, user.data.weightUnit);
};
