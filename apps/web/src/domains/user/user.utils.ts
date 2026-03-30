import { SetSuccessSchema } from "@gym-graphs/shared/set/schemas";
import { CurrentSessionSchema } from "@gym-graphs/shared/auth/schemas";

export const convertWeight = (
  weightInKg: (typeof SetSuccessSchema.Type)["weightInKg"],
  unit: "kg" | "lbs",
) => {
  switch (unit) {
    case "kg":
      return weightInKg;
    case "lbs":
      return weightInKg * 2.205;
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

  return text.replace(anyDigitRegex, (weightInKg) => {
    return `${convertWeight(+weightInKg, weightUnit)} ${convertWeightUnitToSymbol(weightUnit)}`;
  });
};
