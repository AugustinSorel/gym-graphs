"use client";

import type { Exercise } from "@/db/types";
import { useTransition, type PropsWithChildren, useState } from "react";
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
import { updateExerciseMuscleGroups } from "@/serverActions/exercises";
import { muscleGroupsEnum } from "@/db/schema";
import { Loader } from "@/components/ui/loader";

export const ExerciseMuscleGroupsDropdown = ({
  exercise,
  children,
}: { exercise: Exercise } & PropsWithChildren) => {
  const [isPending, startTransition] = useTransition();
  const [lastMuscleGroupSelected, setLastMuscleGroupSelected] = useState<
    (typeof muscleGroupsEnum.enumValues)[number] | null
  >(null);

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
                disabled={isPending && lastMuscleGroupSelected === muscleGroup}
                onCheckedChange={() => {
                  const filteredMuscleGroups = isSelected
                    ? exercise.muscleGroups.filter((v) => v !== muscleGroup)
                    : [...exercise.muscleGroups, muscleGroup];

                  setLastMuscleGroupSelected(muscleGroup);
                  startTransition(async () => {
                    await updateExerciseMuscleGroups({
                      exerciseId: exercise.id,
                      muscleGroups: filteredMuscleGroups,
                    });
                  });
                }}
              >
                {isPending && lastMuscleGroupSelected === muscleGroup && (
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
                  void updateExerciseMuscleGroups({
                    exerciseId: exercise.id,
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
