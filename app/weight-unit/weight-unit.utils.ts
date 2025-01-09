import { ExerciseSet } from "~/db/db.schemas";

export const convertWeight = (
  weightInKg: ExerciseSet["weightInKg"],
  unit: "kg" | "lbs",
) => {
  switch (unit) {
    case "kg":
      return weightInKg;
    case "lbs":
      const res = weightInKg * 2.205;
      return parseInt(res.toString());
  }

  unit satisfies never;
};
