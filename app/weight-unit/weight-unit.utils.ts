import type { Set, User } from "~/db/db.schemas";

export const convertWeight = (
  weightInKg: Set["weightInKg"],
  unit: "kg" | "lbs",
) => {
  switch (unit) {
    case "kg":
      return weightInKg;
    case "lbs":
      return weightInKg * 2.205;
  }

  unit satisfies never;
};

export const convertUserWeightUnitToSymbol = (
  weightUnit: User["weightUnit"],
) => {
  switch (weightUnit) {
    case "kg":
      return "kg";
    case "lbs":
      return "lbs";
  }

  weightUnit satisfies never;
};

export const convertWeightsInText = (
  text: string,
  weightUnit: User["weightUnit"],
) => {
  const anyDigitRegex = /\b\d+(\.\d+)?\b/g;

  return text.replace(anyDigitRegex, (weightInKg) => {
    return `${convertWeight(+weightInKg, weightUnit)} ${convertUserWeightUnitToSymbol(weightUnit)}`;
  });
};
