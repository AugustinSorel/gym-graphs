import { useUser } from "~/user/hooks/use-user";
import { convertWeight } from "~/weight-unit/weight-unit.utils";
import type { Set } from "~/db/db.schemas";

export const WeightValue = (props: Pick<Set, "weightInKg">) => {
  const user = useUser();

  return convertWeight(props.weightInKg, user.data.weightUnit);
};
