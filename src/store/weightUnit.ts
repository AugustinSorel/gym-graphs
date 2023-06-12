import { create } from "zustand";
import { z } from "zod";
import { useEffect } from "react";

const weightUnitSchema = z.enum(["kg", "lbs"]);
type WeightUnit = z.infer<typeof weightUnitSchema>;

type WeightUnitStore = {
  value: WeightUnit;
  setValue: (newValue: WeightUnit) => void;
};

const WEIGHT_KEY = "weightUnit";

export const useWeightUnit = create<WeightUnitStore>((set) => ({
  value: "kg",

  setValue: (newValue) => {
    localStorage.setItem(WEIGHT_KEY, newValue);
    return set((store) => ({ ...store, value: newValue }));
  },
}));

//FIXME: use a context instead of that
export const useSetWeightUnit = () => {
  const setValue = useWeightUnit((state) => state.setValue);

  useEffect(() => {
    try {
      setValue(weightUnitSchema.parse(localStorage.getItem(WEIGHT_KEY)));
    } catch (error) {
      setValue("kg");
    }
  }, [setValue]);
};
