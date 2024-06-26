"use client";

import { ErrorBoundary } from "react-error-boundary";
import { type RouterInputs, type RouterOutputs, api } from "@/trpc/react";
import { type ComponentPropsWithoutRef } from "react";
import { MoreHorizontal, Tag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutationState } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryKey } from "@trpc/react-query";
import { DragComponent, SortableGrid } from "./sortableGrid";
import { pluralize } from "@/lib/utils";
import { useExercises } from "../_components/useExercises";
import { useDashboardSearchParams } from "../_components/useDashboardSearchParams";
import { GridLayout } from "@/components/ui/gridLayout";
import { Card, CardErrorFallback } from "@/components/ui/card";
import { DeleteExerciseAlertDialog } from "../_components/modals/deleteExerciseAlertDialog";
import { UpdateExerciseNameDialog } from "../_components/modals/updateExerciseNameDialog";
import { LineGraph } from "../_components/graphs/lineGraph";
import { RadarGraph } from "../_components/graphs/radarGraph";
import { RandomFacts } from "../_components/graphs/randomFacts";
import { ExerciseMuscleGroupsDropdown } from "./exerciseMuscleGroups";

export const AllExercisesGrid = () => {
  const dashboardShareParams = useDashboardSearchParams();
  const exercises = useExercises();

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
            <ErrorBoundary FallbackComponent={CardErrorFallback}>
              <ExerciseItem exercise={exercise} />
            </ErrorBoundary>
          ),
        }))}
      />

      <ErrorBoundary FallbackComponent={CardErrorFallback}>
        <RadarItem exercises={exercises} />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={CardErrorFallback}>
        <RandomFactsItem exercises={exercises} />
      </ErrorBoundary>
    </GridLayout>
  );
};

const ExerciseItem = ({
  exercise,
}: {
  exercise: RouterOutputs["exercise"]["all"][number];
}) => {
  return (
    <Card.Root>
      <Card.Anchor
        aria-label={`go to ${exercise.name}`}
        href={`/exercises/${exercise.id}`}
      />
      <Card.Header>
        <Card.Title>{exercise.name}</Card.Title>

        <Card.ActionContainer>
          <ExerciseMuscleGroupsDropdown exercise={exercise}>
            <Card.ActionButton aria-label="view exercise tags">
              <Tag className="h-4 w-4" />
            </Card.ActionButton>
          </ExerciseMuscleGroupsDropdown>

          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Card.ActionButton aria-label="view more">
                      <MoreHorizontal className="h-4 w-4" />
                    </Card.ActionButton>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">view more</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel className="capitalize">
                settings
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <UpdateExerciseNameDialog exercise={exercise} />
                <DeleteExerciseAlertDialog exercise={exercise} />
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DragComponent id={exercise.id} />
        </Card.ActionContainer>
      </Card.Header>

      <LineGraph data={exercise.data} />
    </Card.Root>
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

const RadarItem = ({
  exercises,
}: {
  exercises: RouterOutputs["exercise"]["all"];
}) => {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>exercises count</Card.Title>
      </Card.Header>

      <RadarGraph
        data={exercises.map((exercise) => ({
          exerciseName: exercise.name,
          frequency: exercise.data.length,
        }))}
      />
    </Card.Root>
  );
};

const RandomFactsItem = ({
  exercises,
}: {
  exercises: RouterOutputs["exercise"]["all"];
}) => {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>random facts</Card.Title>
      </Card.Header>

      <RandomFacts exercises={exercises} />
    </Card.Root>
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
