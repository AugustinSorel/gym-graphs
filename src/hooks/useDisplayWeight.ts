import { useWeightUnit } from "@/context/weightUnit";

export const useDisplayWeight = () => {
  const weightUnit = useWeightUnit();

  const show = (weight: number) => {
    return new Intl.NumberFormat(undefined, {
      style: "unit",
      unit: weightUnit.get === "kg" ? "kilogram" : "pound",
    }).format(weight);
  };

  return { show };
};
