import { useWeightUnit } from "~/weight-unit/weight-unit.context";
import { ExerciseSet } from "~/db/db.schemas";
import { convertWeight } from "~/weight-unit/weight-units.utils";

export const WeightValue = (props: Pick<ExerciseSet, "weightInKg">) => {
  const weightUnit = useWeightUnit();

  return convertWeight(props.weightInKg, weightUnit.value);
};
