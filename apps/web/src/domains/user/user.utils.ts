import { SetSuccessSchema } from "@gym-graphs/shared/set/schemas";
import { CurrentSessionSchema } from "@gym-graphs/shared/auth/schemas";

const lbsPerKg = 2.20462;

export const convertWeight = (
  weightInMg: (typeof SetSuccessSchema.Type)["weightInMg"],
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
): (typeof SetSuccessSchema.Type)["weightInMg"] => {
  switch (unit) {
    case "kg":
      return displayValue * 1_000_000;
    case "lbs":
      return (displayValue / lbsPerKg) * 1_000_000;
  }
};

export const convertWeightUnitToSymbol = (
  weightUnit: (typeof CurrentSessionSchema.Type)["user"]["weightUnit"],
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
  weightUnit: (typeof CurrentSessionSchema.Type)["user"]["weightUnit"],
) => {
  const anyDigitRegex = /\b\d+(\.\d+)?\b/g;

  return text.replace(anyDigitRegex, (weightInMg) => {
    return `${convertWeight(+weightInMg, weightUnit)} ${convertWeightUnitToSymbol(weightUnit)}`;
  });
};
