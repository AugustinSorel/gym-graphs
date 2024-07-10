"use client";

import type { Exercise } from "@/server/db/types";
import { api } from "@/trpc/react";

export const useExercise = (props: Pick<Exercise, "id">) => {
  return api.exercise.get.useSuspenseQuery({ id: props.id });
};
