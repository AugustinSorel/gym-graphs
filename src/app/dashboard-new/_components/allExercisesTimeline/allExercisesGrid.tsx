"use client";

import { type RouterInputs, type RouterOutputs, api } from "@/trpc/react";
import { type ComponentPropsWithoutRef } from "react";
import { GridLayout } from "@/app/dashboard/_grid/gridLayout";
import { GridItem } from "@/app/dashboard/_grid/gridItem";
import { ExerciseMuscleGroupsDropdown } from "@/app/dashboard/@allExercisesGrid/exerciseMuscleGroups";
import { MoreHorizontal, Tag } from "lucide-react";
import { LineGraph } from "@/app/dashboard/_graphs/lineGraph";
import { RadarGraph } from "@/app/dashboard/_graphs/radarGraph";
import { RandomFacts } from "@/app/dashboard/_graphs/randomFacts";
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
import { UpdateExerciseNameDialog } from "@/app/dashboard/_modals/updateExerciseNameDialog";
import { DeleteExerciseAlertDialog } from "@/app/dashboard/_modals/deleteExerciseAlertDialog";
import { DragComponent, SortableGrid } from "./sortableGrid";
import { pluralize } from "@/lib/utils";
import { useExercises } from "../useExercises";
import { useDashboardSearchParams } from "../useDashboardSearchParams";

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
          component: <ExerciseItem exercise={exercise} />,
        }))}
      />

      <RadarItem exercises={exercises} />
      <RandomFactsItem exercises={exercises} />
    </GridLayout>
  );
};

const ExerciseItem = ({
  exercise,
}: {
  exercise: RouterOutputs["exercise"]["all"][number];
}) => {
  return (
    <GridItem.Root>
      <GridItem.Anchor
        aria-label={`go to ${exercise.name}`}
        href={`/exercises/${exercise.id}`}
      />
      <GridItem.Header>
        <GridItem.Title>{exercise.name}</GridItem.Title>

        <GridItem.ActionContainer>
          <ExerciseMuscleGroupsDropdown exercise={exercise}>
            <GridItem.ActionButton aria-label="view exercise tags">
              <Tag className="h-4 w-4" />
            </GridItem.ActionButton>
          </ExerciseMuscleGroupsDropdown>

          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <GridItem.ActionButton aria-label="view more">
                      <MoreHorizontal className="h-4 w-4" />
                    </GridItem.ActionButton>
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
        </GridItem.ActionContainer>
      </GridItem.Header>

      <LineGraph data={exercise.data} />
    </GridItem.Root>
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
          <GridItem.Root>
            <GridItem.Header>
              <GridItem.Title>{mutation.name}</GridItem.Title>
            </GridItem.Header>
          </GridItem.Root>
        </Skeleton>
      ))}
    </>
  );
};

//TODO: add error boundaries
const RadarItem = ({
  exercises,
}: {
  exercises: RouterOutputs["exercise"]["all"];
}) => {
  return (
    <GridItem.Root>
      <GridItem.Header>
        <GridItem.Title>exercises count</GridItem.Title>
      </GridItem.Header>

      <RadarGraph
        data={exercises.map((exercise) => ({
          exerciseName: exercise.name,
          frequency: exercise.data.length,
        }))}
      />
    </GridItem.Root>
  );
};

const RandomFactsItem = ({
  exercises,
}: {
  exercises: RouterOutputs["exercise"]["all"];
}) => {
  return (
    <GridItem.Root>
      <GridItem.Header>
        <GridItem.Title>random facts</GridItem.Title>
      </GridItem.Header>

      <RandomFacts exercises={exercises} />
    </GridItem.Root>
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
