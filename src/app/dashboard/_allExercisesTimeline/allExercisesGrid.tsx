"use client";

import { ErrorBoundary } from "react-error-boundary";
import { type RouterInputs, api } from "@/trpc/react";
import { type ComponentPropsWithoutRef } from "react";
import { useMutationState } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryKey } from "@trpc/react-query";
import { SortableGrid } from "./sortableGrid";
import { pluralize } from "@/lib/utils";
import { useDashboardSearchParams } from "../_components/useDashboardSearchParams";
import { GridLayout } from "@/components/ui/gridLayout";
import { Card } from "@/components/ui/card";
import { ExerciseOverviewCard } from "@/components/cards/exerciseOverviewCard";
import { ExercisesRadarCard } from "@/components/cards/exercisesRadarCard";
import { UserRandomFactsCard } from "@/components/cards/userRandomFactsCard";
import { prepareUserRandomFactsData } from "@/lib/math";
import { useDashboardExercises } from "../_components/useDashboardExercises";

export const AllExercisesGrid = () => {
  const dashboardShareParams = useDashboardSearchParams();
  const [exercises] = useDashboardExercises();

  if (!exercises.length && dashboardShareParams.exerciseName) {
    return (
      <Container>
        <Text>
          no exercises named{" "}
          <PropsText>{dashboardShareParams.exerciseName}</PropsText> found
        </Text>
      </Container>
    );
  }

  if (!exercises.length && dashboardShareParams.muscleGroups) {
    return (
      <Container>
        <Text>
          no exercises with the{" "}
          {pluralize({
            count: dashboardShareParams.muscleGroups.length,
            noun: "tag",
          })}{" "}
          of{" "}
          <PropsText>{dashboardShareParams.muscleGroups.join(", ")}</PropsText>{" "}
          found
        </Text>
      </Container>
    );
  }

  if (!exercises.length && !dashboardShareParams.exerciseName) {
    return (
      <Container>
        <Text>
          Your dashboard is empty
          <br />
          Start adding new data with the form above
        </Text>
      </Container>
    );
  }

  return (
    <GridLayout>
      <OptimisticExerciseItem />

      <SortableGrid
        gridItems={exercises.map((exercise) => ({
          id: exercise.id,
          component: (
            <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
              <ExerciseOverviewCard exercise={exercise} />
            </ErrorBoundary>
          ),
        }))}
      />

      <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
        <ExercisesRadarCard
          data={exercises.map((exercise) => ({
            exerciseName: exercise.name,
            frequency: exercise.data.length,
          }))}
        />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
        <UserRandomFactsCard data={prepareUserRandomFactsData(exercises)} />
      </ErrorBoundary>
    </GridLayout>
  );
};

const OptimisticExerciseItem = () => {
  const createExerciseMutations = useMutationState({
    filters: {
      mutationKey: getQueryKey(api.exercise.create),
      status: "pending",
    },
    select: (x) => x.state.variables as RouterInputs["exercise"]["create"],
  });

  return (
    <>
      {createExerciseMutations.map((mutation, i) => (
        <Skeleton key={i}>
          <Card.Root>
            <Card.Header>
              <Card.Title>{mutation.name}</Card.Title>
            </Card.Header>
          </Card.Root>
        </Skeleton>
      ))}
    </>
  );
};

const Container = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="mt-10 flex flex-col items-center space-y-5 text-center"
    />
  );
};

const Text = (props: ComponentPropsWithoutRef<"p">) => {
  return <p {...props} className="text-xl text-muted-foreground" />;
};

const PropsText = (props: ComponentPropsWithoutRef<"span">) => {
  return <span {...props} className="text-brand-color-two" />;
};
