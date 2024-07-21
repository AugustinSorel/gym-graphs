"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
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
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardSearchParams } from "../_components/useDashboardSearchParams";
import { muscleGroupsEnum } from "@/server/db/schema";

export const FilterByExerciseName = () => {
  const dashboardSearchParams = useDashboardSearchParams();

  const [exerciseName, setExerciseName] = useState(
    dashboardSearchParams.exerciseName,
  );

  return (
    <div className="flex items-center gap-2">
      <Input
        className="h-8 max-w-[10rem] placeholder:select-none"
        placeholder="filter exercises..."
        value={exerciseName}
        onChange={(e) => {
          dashboardSearchParams.updateExerciseName(e.target.value);
          setExerciseName(e.target.value);
        }}
      />
    </div>
  );
};

export const FilterByExrerciseMuscleGroups = () => {
  const dashboardSearchParams = useDashboardSearchParams();

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                data-filters-number={dashboardSearchParams.muscleGroups.length}
                className="relative h-8 p-1 backdrop-filter after:absolute after:-right-1/3 after:-top-1/3 after:flex after:h-5 after:w-5 after:items-center after:justify-center after:rounded-full after:border after:border-border after:bg-brand-color-two after:text-xs after:backdrop-blur-md after:content-[attr(data-filters-number)] data-[filters-number='0']:after:hidden"
                aria-label="filters with tags"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
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
            const isSelected =
              dashboardSearchParams.muscleGroups.includes(muscleGroup);

            return (
              <DropdownMenuCheckboxItem
                key={muscleGroup}
                checked={isSelected}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => {
                  const filteredMuscleGroups = isSelected
                    ? dashboardSearchParams.muscleGroups.filter(
                        (v) => v !== muscleGroup,
                      )
                    : [...dashboardSearchParams.muscleGroups, muscleGroup];

                  dashboardSearchParams.updateMuscleGroups(
                    filteredMuscleGroups,
                  );
                }}
              >
                {muscleGroup}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>

        {dashboardSearchParams.muscleGroups.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => {
                  dashboardSearchParams.updateMuscleGroups([]);
                }}
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
