"use client";

import { api, type RouterOutputs } from "@/trpc/react";

export const useExercise = (
  props: Pick<RouterOutputs["exercise"]["get"], "id">,
) => {
  return api.exercise.get.useSuspenseQuery({ id: props.id });
};
