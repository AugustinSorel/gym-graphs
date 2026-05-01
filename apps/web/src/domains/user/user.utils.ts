import type { Set } from "@gym-graphs/shared/set/schemas";
import type { CurrentUser } from "@gym-graphs/shared/auth/schemas";

const lbsPerKg = 2.20462;

export const convertWeight = (
  weightInMg: Set["weightInMg"],
  unit: "kg" | "lbs",
) => {
  switch (unit) {
    case "kg":
      return weightInMg / 1_000_000;
    case "lbs":
      return (weightInMg / 1_000_000) * lbsPerKg;
  }
};

export const convertWeightToMg = (
  displayValue: number,
  unit: "kg" | "lbs",
): Set["weightInMg"] => {
  switch (unit) {
    case "kg":
      return displayValue * 1_000_000;
    case "lbs":
      return (displayValue / lbsPerKg) * 1_000_000;
  }
};

export const convertWeightUnitToSymbol = (
  weightUnit: CurrentUser["weightUnit"],
) => {
  switch (weightUnit) {
    case "kg":
      return "kg";
    case "lbs":
      return "lbs";
  }
};

export const convertWeightsInText = (
  text: string,
  weightUnit: CurrentUser["weightUnit"],
) => {
  const anyDigitRegex = /\b\d+(\.\d+)?\b/g;

  return text.replace(anyDigitRegex, (weightInMg) => {
    return `${convertWeight(+weightInMg, weightUnit)} ${convertWeightUnitToSymbol(weightUnit)}`;
  });
};
