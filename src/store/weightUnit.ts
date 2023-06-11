import { create } from "zustand";
import { z } from "zod";

const weightUnitSchema = z.enum(["kg", "lbs"]);
type WeightUnit = z.infer<typeof weightUnitSchema>;

type WeightUnitStore = {
  value: WeightUnit;
  setValue: (newValue: WeightUnit) => void;
};

const WEIGHT_KEY = "weightUnit";

export const useWeightUnit = create<WeightUnitStore>((set) => ({
  value: (() => {
    const weightUnitRaw = weightUnitSchema.safeParse(
      localStorage.getItem(WEIGHT_KEY)
    );

    return weightUnitRaw.success ? weightUnitRaw.data : "kg";
  })(),

  setValue: (newValue) => {
    localStorage.setItem(WEIGHT_KEY, newValue);
    return set((store) => ({ ...store, value: newValue }));
  },
}));
