import type { Set, User } from "@gym-graphs/api/db";

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
};

export const convertWeightUnitToSymbol = (weightUnit: User["weightUnit"]) => {
  switch (weightUnit) {
    case "kg":
      return "kg";
    case "lbs":
      return "lbs";
  }
};

export const convertWeightsInText = (
  text: string,
  weightUnit: User["weightUnit"],
) => {
  const anyDigitRegex = /\b\d+(\.\d+)?\b/g;

  return text.replace(anyDigitRegex, (weightInKg) => {
    return `${convertWeight(+weightInKg, weightUnit)} ${convertWeightUnitToSymbol(weightUnit)}`;
  });
};
