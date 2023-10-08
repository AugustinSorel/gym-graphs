"use client";

import type { Exercise } from "@/db/types";
import { useState, type PropsWithChildren } from "react";
import { MuscleGroupsDropdown } from "../muscleGroupsDropdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { updateExerciseMuscleGroups } from "@/serverActions/exercises";

export const ExerciseMuscleGroupsDropdown = ({
  exercise,
  children,
}: { exercise: Exercise } & PropsWithChildren) => {
  const [selectedValues, setSelectedValues] = useState(exercise.muscleGroups);
  return (
    <MuscleGroupsDropdown
      selectedValues={selectedValues}
      updateValues={(newValues) => {
        setSelectedValues(newValues);
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
