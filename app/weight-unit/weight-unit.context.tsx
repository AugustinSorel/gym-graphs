import { createContext, PropsWithChildren, use, useState } from "react";
import { useLocalStorage } from "~/hooks/use-localestorage";
import {
  WeightUnit,
  weightUnitSchema,
} from "~/weight-unit/weight-unit.schemas";

type Context = { value: WeightUnit; set: (weightUnit: WeightUnit) => void };
const Context = createContext<Context | undefined>(undefined);

export const WeightUnitProvider = (props: PropsWithChildren) => {
  const localStorage = useLocalStorage(
    "weight-unit",
    weightUnitSchema.catch("kg"),
  );

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => {
    return typeof window !== "undefined" ? localStorage.get() : "kg";
  });

  return (
    <Context
      value={{
        value: weightUnit,
        set: (weightUnit) => {
          setWeightUnit(weightUnit);
          localStorage.set(weightUnit);
        },
      }}
      {...props}
    />
  );
};

export const useWeightUnit = () => {
  const context = use(Context);

  if (!context) {
    throw new Error("useWeightUnit msut be wrapped in a <WeightUnitProvider/>");
  }

  return context;
};
