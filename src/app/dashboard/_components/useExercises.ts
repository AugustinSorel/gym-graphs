"use client";

import { api, type RouterOutputs } from "@/trpc/react";

type Props = Parameters<
  typeof api.exercise.all.useSuspenseQuery<
    RouterOutputs["exercise"]["all"],
    RouterOutputs["exercise"]["all"]
  >
>[1];

export const useExercises = (props?: Props) => {
  return api.exercise.all.useSuspenseQuery(undefined, props);
};
