import { SetSuccessSchema } from "@gym-graphs/shared/set/schemas";
import { CurrentSessionSchema } from "@gym-graphs/shared/auth/schemas";

const lbsPerKg = 2.20462;

export const convertWeight = (
  weightInG: (typeof SetSuccessSchema.Type)["weightInG"],
  unit: "kg" | "lbs",
) => {
  switch (unit) {
    case "kg":
      return weightInG / 1000;
    case "lbs":
      return (weightInG / 1000) * lbsPerKg;
  }
};

export const convertWeightToG = (
  displayValue: number,
  unit: "kg" | "lbs",
): (typeof SetSuccessSchema.Type)["weightInG"] => {
  switch (unit) {
    case "kg":
      return displayValue * 1000;
    case "lbs":
      return (displayValue / lbsPerKg) * 1000;
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

  return text.replace(anyDigitRegex, (weightInG) => {
    return `${convertWeight(+weightInG, weightUnit)} ${convertWeightUnitToSymbol(weightUnit)}`;
  });
};
