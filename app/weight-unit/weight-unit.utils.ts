import type { Set } from "~/db/db.schemas";

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
