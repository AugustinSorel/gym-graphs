//FIXME: add convertion to lbs
import { z } from "zod";
import { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { createContext, useContext } from "react";

const WEIGHT_KEY = "weightUnit";

const weightUnitSchema = z.enum(["kg", "lbs"]);
export type WeightUnit = z.infer<typeof weightUnitSchema>;

type WeightUnitContext = {
  get: WeightUnit;
  set: (newWeight: WeightUnit) => void;
};

const WeightUnitContext = createContext<WeightUnitContext | null>(null);

export const WeightUnitProvider = ({ children }: PropsWithChildren) => {
  const [weightUnit, setWweightUnit] = useState<WeightUnit>("kg");

  useEffect(() => {
    try {
      setWweightUnit(weightUnitSchema.parse(localStorage.getItem(WEIGHT_KEY)));
    } catch (error) {
      setWweightUnit("kg");
    }
  }, []);

  return (
    <WeightUnitContext.Provider
      value={{
        get: weightUnit,
        set: (newWeightValue) => {
          localStorage.setItem(WEIGHT_KEY, newWeightValue ?? "kg");
          setWweightUnit(newWeightValue);
        },
      }}
    >
      {children}
    </WeightUnitContext.Provider>
  );
};

export const useWeightUnit = () => {
  const currentWeightUnitContext = useContext(WeightUnitContext);

  if (!currentWeightUnitContext) {
    throw new Error(
      "useWeightUnit has to be used within <WeightUnitProvider.Provider>"
    );
  }

  return currentWeightUnitContext;
};
