import { useUser } from "~/domains/user/hooks/use-user";
import { convertWeight } from "~/domains/user/user.utils";
import type { Set } from "@gym-graphs/api";

export const WeightValue = (props: Pick<Set, "weightInKg">) => {
  const user = useUser();

  return convertWeight(props.weightInKg, user.data.weightUnit);
};
