"use client";

import type { Exercise } from "@/db/types";
import { type PropsWithChildren, useState } from "react";
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
import { Loader } from "@/components/ui/loader";
import { api } from "@/trpc/react";

export const ExerciseMuscleGroupsDropdown = ({
  exercise,
  children,
}: { exercise: Exercise } & PropsWithChildren) => {
  const [lastMuscleGroupSelected, setLastMuscleGroupSelected] = useState<
    (typeof muscleGroupsEnum.enumValues)[number] | null
  >(null);

  //TODO:performance
  const updateMuscleGroup = api.exercise.muscleGroup.useMutation({});

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
                disabled={
                  updateMuscleGroup.isPending &&
                  lastMuscleGroupSelected === muscleGroup
                }
                onCheckedChange={() => {
                  const filteredMuscleGroups = isSelected
                    ? exercise.muscleGroups.filter((v) => v !== muscleGroup)
                    : [...exercise.muscleGroups, muscleGroup];

                  setLastMuscleGroupSelected(muscleGroup);

                  updateMuscleGroup.mutate({
                    id: exercise.id,
                    muscleGroups: filteredMuscleGroups,
                  });
                }}
              >
                {updateMuscleGroup.isPending &&
                  lastMuscleGroupSelected === muscleGroup && (
                    <Loader className="mr-1 h-3 w-3" />
                  )}
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
