import { z } from "zod";
import { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { createContext, useContext } from "react";

const WEIGHT_KEY = "weightUnit";

export const weightUnitSchema = z.enum(["kg", "lb"]).catch("kg");
export type WeightUnit = z.infer<typeof weightUnitSchema>;

type WeightUnitContext = {
  get: WeightUnit;
  set: (newWeight: WeightUnit) => void;
};

const WeightUnitContext = createContext<WeightUnitContext | null>(null);

export const WeightUnitProvider = ({ children }: PropsWithChildren) => {
  const [weightUnit, setWweightUnit] = useState<WeightUnit>("kg");

  useEffect(() => {
    setWweightUnit(weightUnitSchema.parse(localStorage.getItem(WEIGHT_KEY)));
  }, []);

  return (
    <WeightUnitContext.Provider
      value={{
        get: weightUnit,
        set: (newWeightValue) => {
          localStorage.setItem(WEIGHT_KEY, newWeightValue);
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
      "useWeightUnit has to be used within <WeightUnitProvider.Provider>",
    );
  }

  return currentWeightUnitContext;
};
