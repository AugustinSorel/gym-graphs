"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import type { Exercise } from "@/db/types";
import { muscleGroupsEnum } from "@/db/schema";
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
import { exerciseSchema } from "@/schemas/exercise.schema";

export const FilterByExerciseName = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [exerciseName, setExerciseName] = useState(
    searchParams.get("name") ?? "",
  );

  const updateExerciseNameUrlParams = (e: ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);

    if (!e.target.value) {
      params.delete("name");
    } else {
      params.set("name", e.target.value);
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        className="h-8 max-w-[10rem] placeholder:select-none"
        placeholder="filter exercises..."
        value={exerciseName}
        onChange={(e) => {
          updateExerciseNameUrlParams(e);
          setExerciseName(e.target.value);
        }}
      />
    </div>
  );
};

export const FilterByExrerciseMuscleGroups = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedMuscleGroups = exerciseSchema.shape.muscleGroups
    .catch([])
    .parse(searchParams.get("muscle_groups")?.split(","));

  const updateTagsUrlParams = (
    selectedMuscleGroups: Exercise["muscleGroups"],
  ) => {
    const params = new URLSearchParams(searchParams);

    if (!selectedMuscleGroups.length) {
      params.delete("muscle_groups");
    } else {
      params.set("muscle_groups", selectedMuscleGroups.join(","));
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                data-filters-number={selectedMuscleGroups.length}
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
            const isSelected = selectedMuscleGroups.includes(muscleGroup);

            return (
              <DropdownMenuCheckboxItem
                key={muscleGroup}
                checked={isSelected}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => {
                  const filteredMuscleGroups = isSelected
                    ? selectedMuscleGroups.filter((v) => v !== muscleGroup)
                    : [...selectedMuscleGroups, muscleGroup];

                  updateTagsUrlParams(filteredMuscleGroups);
                }}
              >
                {muscleGroup}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>

        {selectedMuscleGroups.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => {
                  updateTagsUrlParams([]);
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
