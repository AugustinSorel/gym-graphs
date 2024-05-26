"use client";

import type { Exercise } from "@/db/types";
import { type PropsWithChildren } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { muscleGroupsEnum } from "@/db/schema";
import { api } from "@/trpc/react";

export const ExerciseMuscleGroupsDropdown = ({
  exercise,
  children,
}: { exercise: Exercise } & PropsWithChildren) => {
  const utils = api.useUtils();

  const updateMuscleGroup = api.exercise.muscleGroup.useMutation({
    onMutate: (exerciseToUpdate) => {
      const allExercises = utils.exercise.all.getData();

      if (!allExercises) {
        return;
      }

      utils.exercise.all.setData(
        undefined,
        allExercises.map((exercise) =>
          exercise.id === exerciseToUpdate.id
            ? { ...exercise, muscleGroups: exerciseToUpdate.muscleGroups }
            : exercise,
        ),
      );
    },
    onSettled: async () => {
      await utils.exercise.all.invalidate();
    },
  });

  return (
    <DropdownMenu>
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
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel className="capitalize">
          muscle groups
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {muscleGroupsEnum.enumValues.map((muscleGroup) => {
            const isSelected = exercise.muscleGroups.includes(muscleGroup);
            return (
              <DropdownMenuCheckboxItem
                key={muscleGroup}
                checked={isSelected}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => {
                  const filteredMuscleGroups = isSelected
                    ? exercise.muscleGroups.filter((v) => v !== muscleGroup)
                    : [...exercise.muscleGroups, muscleGroup];

                  updateMuscleGroup.mutate({
                    id: exercise.id,
                    muscleGroups: filteredMuscleGroups,
                  });
                }}
              >
                {muscleGroup}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>

        {exercise.muscleGroups.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() =>
                  updateMuscleGroup.mutate({
                    id: exercise.id,
                    muscleGroups: [],
                  })
                }
                className="justify-center text-center"
              >
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
