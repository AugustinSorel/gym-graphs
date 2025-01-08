import { useWeightUnit } from "~/weight-unit/weight-unit.context";

export const WeightUnit = () => {
  const weightUnit = useWeightUnit();

  switch (weightUnit.value) {
    case "kg":
      return "kg";
    case "lbs":
      return "lbs";
  }

  weightUnit.value satisfies never;
};
