"use client";

import { useParams } from "next/navigation";
import { exercisePageParamsSchema } from "./exercisePageParams";

export const useExercisePageParams = () => {
  const unsafeParams = useParams();
  const params = exercisePageParamsSchema.parse(unsafeParams);

  return params;
};
