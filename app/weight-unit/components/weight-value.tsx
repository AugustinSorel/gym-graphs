import { useUser } from "~/user/hooks/use-user";
import type { Set } from "~/db/db.schemas";
import { convertWeight } from "~/weight-unit/weight-unit.utils";

export const WeightValue = (props: Pick<Set, "weightInKg">) => {
  const user = useUser();

  return convertWeight(props.weightInKg, user.data.weightUnit);
};
