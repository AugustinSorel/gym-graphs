import {
  SelectSetsSuccess,
  SetSuccessSchema,
} from "@gym-graphs/shared/set/schemas";
import { CurrentSessionSchema } from "@gym-graphs/shared/auth/schemas";

export const calculateOneRepMax = (
  weight: (typeof SetSuccessSchema.Type)["weightInMg"],
  repetitions: (typeof SetSuccessSchema.Type)["repetitions"],
  algo: (typeof CurrentSessionSchema.Type)["user"]["oneRepMaxAlgo"],
) => {
  if (repetitions < 1) {
    throw new Error("repetitions must be above 0");
  }

  if (weight < 0) {
    throw new Error("weight cannot be negative");
  }

  const calculateOneRepMax = algoToOneRepMax[algo];

  return calculateOneRepMax(weight, repetitions);
};

export const calculateVolume = (
  weight: (typeof SetSuccessSchema.Type)["weightInMg"],
  repetitions: (typeof SetSuccessSchema.Type)["repetitions"],
) => {
  if (repetitions < 1) {
    throw new Error("repetitions must be above 0");
  }

  if (weight < 0) {
    throw new Error("weight cannot be negative");
  }

  const volume = weight * repetitions;

  return volume;
};

export const exceedsOneRepMax = (
  a: (typeof SelectSetsSuccess.Type)[number],
  b: (typeof SelectSetsSuccess.Type)[number],
) => {
  const currentOneRepMax = calculateOneRepMax(
    a.weightInMg,
    a.repetitions,
    "epley",
  );

  const candidateOneRepMax = calculateOneRepMax(
    b.weightInMg,
    b.repetitions,
    "epley",
  );

  return candidateOneRepMax > currentOneRepMax;
};

export const accumulateVolumeInSets = (sets: typeof SelectSetsSuccess.Type) => {
  return sets.reduce((acc, set) => {
    return acc + calculateVolume(set.weightInMg, set.repetitions);
  }, 0);
};

  const algoToOneRepMax: Record<
  (typeof CurrentSessionSchema.Type)["user"]["oneRepMaxAlgo"],
  (
    weight: (typeof SetSuccessSchema.Type)["weightInMg"],
    repetitions: (typeof SetSuccessSchema.Type)["repetitions"],
  ) => number
> = {
  adams: (w, r) => {
    return w / (1 - 0.02 * r);
  },
  baechle: (w, r) => {
    return w * (1 + 0.033 * r);
  },
  berger: (w, r) => {
    return w / 1.0261 ** (0.0262 * r);
  },
  brown: (w, r) => {
    return w * (0.9849 + 0.0328 * r);
  },
  brzycki: (w, r) => {
    return (w * 36) / (37 - r);
  },
  epley: (w, r) => {
    return w * (1 + r / 30);
  },
  kemmler: (w, r) => {
    return w * (0.988 + 0.0104 * r + 0.0019 * r ** 2 - 0.0000584 * r ** 3);
  },
  landers: (w, r) => {
    return w / (1.013 - 0.0267123 * r);
  },
  lombardi: (w, r) => {
    return w * r ** 0.1;
  },
  mayhew: (w, r) => {
    return w / (0.522 + 0.419 * Math.E ** (-0.055 * r));
  },
  naclerio: (w, r) => {
    return w / (0.951 * Math.E ** (-0.021 * r));
  },
  oConner: (w, r) => {
    return w * (1 + 0.025 * r);
  },
  wathen: (w, r) => {
    return w / (0.488 + 0.538 * Math.E ** (-0.075 * r));
  },
};

export const getBestSetFromSets = (
  sets: ReadonlyArray<typeof SetSuccessSchema.Type>,
) => {
  const setsSortedDesc = sets.toSorted((a, b) => {
    return b.repetitions * b.weightInMg - a.repetitions * a.weightInMg;
  });

  return setsSortedDesc.at(0);
};
