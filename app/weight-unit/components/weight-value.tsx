import { useUser } from "~/user/user.context";
import { ExerciseSet } from "~/db/db.schemas";
import { convertWeight } from "~/weight-unit/weight-unit.utils";

export const WeightValue = (props: Pick<ExerciseSet, "weightInKg">) => {
  const user = useUser();

  return convertWeight(props.weightInKg, user.weightUnit);
};
