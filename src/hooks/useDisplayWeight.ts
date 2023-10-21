import { useWeightUnit } from "@/context/weightUnit";
import { convertWeightToLbs } from "@/lib/math";

export const useDisplayWeight = () => {
  const weightUnit = useWeightUnit();

  const show = (weight: number) => {
    return new Intl.NumberFormat(undefined, {
      style: "unit",
      unit: weightUnit.get === "kg" ? "kilogram" : "pound",
    }).format(convertWeightToLbs(weight, weightUnit.get));
  };

  return { show };
};
