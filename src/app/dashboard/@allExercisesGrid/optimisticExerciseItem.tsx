"use client";

import { type MutationState, useMutationState } from "@tanstack/react-query";
import { GridItem } from "../_grid/gridItem";
import { getQueryKey } from "@trpc/react-query";
import { type RouterInputs, api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { RadarGraph } from "../_graphs/radarGraph";

type CreateExerciseMutationState = MutationState<
  unknown,
  Error,
  RouterInputs["exercise"]["create"]
>;

export const OptimisticExerciseItem = () => {
  const createExerciseMutations = useMutationState<CreateExerciseMutationState>(
    {
      filters: { mutationKey: getQueryKey(api.exercise.create) },
    },
  );

  const latestMutation = createExerciseMutations?.at(-1);
  const newExerciseName = latestMutation?.variables?.name;

  if (!newExerciseName || latestMutation?.status !== "pending") {
    return null;
  }

  return (
    <Skeleton>
      <GridItem.Root>
        <GridItem.Header>
          <GridItem.Title>{newExerciseName}</GridItem.Title>
        </GridItem.Header>
      </GridItem.Root>
    </Skeleton>
  );
};
