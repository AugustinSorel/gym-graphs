"use client";

import { DragComponent, SortableGrid } from "./sortableGrid";
import { GridItem } from "../_grid/gridItem";
import { LineGraph } from "../_graphs/lineGraph";
import { RadarGraph } from "../_graphs/radarGraph";
import { GridLayout } from "../_grid/gridLayout";
import { MoreHorizontal, Tag } from "lucide-react";
import { useDashboardFilters } from "../dashboardFiltersContext";
import type { Exercise, ExerciseWithData } from "@/db/types";
import { MuscleGroupsDropdown } from "../muscleGroupsDropdown";
import {
  deleteExerciseAction,
  updateExerciseMuscleGroups,
  updateExerciseNameAction,
} from "@/serverActions/exercises";
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
import { UpdateExerciseNameDialog } from "../_modals/updateExerciseNameDialog";
import { DeleteExerciseAlertDialog } from "../_modals/deleteExerciseAlertDialog";
import { useState, type PropsWithChildren } from "react";

type Props = {
  exercises: ExerciseWithData[];
};

export const Grid = ({ exercises }: Props) => {
  const dashboardFilters = useDashboardFilters();

  const filteredExercises = dashboardFilters.apply(exercises);

  return (
    <GridLayout>
      <SortableGrid
        gridItems={filteredExercises.map((exercise) => ({
          id: exercise.id,
          render: (
            <GridItem.Root>
              <GridItem.Anchor
                aria-label={`go to ${exercise.name}`}
                href={`/exercises/${exercise.id}`}
              />
              <GridItem.Header>
                <GridItem.Title>{exercise.name}</GridItem.Title>

                <GridItem.ActionContainer>
                  <ExerciseMuscleGroup exercise={exercise}>
                    <GridItem.ActionButton aria-label="view exercise tags">
                      <Tag className="h-4 w-4" />
                    </GridItem.ActionButton>
                  </ExerciseMuscleGroup>

                  <ExerciseDropDown exercise={exercise}>
                    <GridItem.ActionButton aria-label="view more">
                      <MoreHorizontal className="h-4 w-4" />
                    </GridItem.ActionButton>
                  </ExerciseDropDown>

                  <DragComponent id={exercise.id} />
                </GridItem.ActionContainer>
              </GridItem.Header>

              <LineGraph data={exercise.data} />
            </GridItem.Root>
          ),
        }))}
      />

      <GridItem.Root>
        <GridItem.Header>
          <GridItem.Title>exercises count</GridItem.Title>
        </GridItem.Header>

        <RadarGraph
          data={filteredExercises.map((exercise) => ({
            exerciseName: exercise.name,
            frequency: exercise.data.length,
          }))}
        />
      </GridItem.Root>
    </GridLayout>
  );
};

const ExerciseMuscleGroup = ({
  exercise,
  children,
}: { exercise: Exercise } & PropsWithChildren) => {
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState(
    exercise.muscleGroups
  );

  return (
    <MuscleGroupsDropdown
      selectedValues={selectedMuscleGroups}
      updateValues={(newValues) => {
        setSelectedMuscleGroups(newValues);
        void updateExerciseMuscleGroups(exercise.id, newValues);
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">tags</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </MuscleGroupsDropdown>
  );
};

export const ExerciseDropDown = ({
  exercise,
  children,
}: { exercise: Exercise } & PropsWithChildren) => {
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">view more</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel className="capitalize">settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <UpdateExerciseNameDialog
            onAction={updateExerciseNameAction}
            exercise={exercise}
          />
          <DeleteExerciseAlertDialog
            onAction={deleteExerciseAction}
            exercise={exercise}
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
