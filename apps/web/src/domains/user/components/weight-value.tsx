import { useUser } from "~/domains/user/hooks/use-user";
import { convertWeight } from "~/domains/user/user.utils";
import { SetSuccessSchema } from "@gym-graphs/shared/set/schemas";

export const WeightValue = (
  props: Pick<typeof SetSuccessSchema.Type, "weightInKg">,
) => {
  const user = useUser();

  return convertWeight(props.weightInKg, user.data.weightUnit);
};
