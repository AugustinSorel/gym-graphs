"use client";

import type { Exercise } from "@/db/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { ChangeEvent } from "react";
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
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { muscleGroupsEnum } from "@/db/schema";

export const SearchFilter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [exerciseName, setExerciseName] = useState(
    searchParams.get("search") || ""
  );

  const updateExerciseNameUrlParams = (e: ChangeEvent<HTMLInputElement>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (!e.target.value) {
      current.delete("search");
    } else {
      current.set("search", e.target.value);
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";

    startTransition(() => {
      router.push(`${pathname}${query}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      {isPending && <Loader />}
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

export const MuscleGroupsFilter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const muscleGroups = searchParams.get("tags");
  const selectedValues = muscleGroups
    ? (muscleGroups
        .split(",")
        .filter((muscleGroup) =>
          (muscleGroupsEnum.enumValues as string[]).includes(muscleGroup)
        ) as Exercise["muscleGroups"])
    : [];

  const [lastOptionClicked, setLastOptionClicked] = useState<
    Exercise["muscleGroups"][number] | null
  >(null);

  const updateTagsUrlParams = (newMuscleGroups: Exercise["muscleGroups"]) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (newMuscleGroups.length < 1) {
      current.delete("tags");
    } else {
      current.set("tags", newMuscleGroups.join(","));
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";

    startTransition(() => {
      router.push(`${pathname}${query}`);
    });
  };

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                data-filters-number={selectedValues.length}
                className="relative h-8 p-1 backdrop-filter after:absolute after:-right-1/3 after:-top-1/3 after:flex after:h-5 after:w-5 after:items-center after:justify-center after:rounded-full after:border after:border-border after:bg-brand-color-two after:text-xs after:backdrop-blur-md after:content-[attr(data-filters-number)] data-[filters-number='0']:after:hidden"
                disabled={isPending}
                aria-label="filters with tags"
              >
                {isPending ? (
                  <Loader className="h-4 w-4" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
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
            const isSelected = selectedValues.includes(muscleGroup);

            return (
              <DropdownMenuCheckboxItem
                key={muscleGroup}
                checked={isSelected}
                onSelect={(e) => e.preventDefault()}
                disabled={isPending && lastOptionClicked === muscleGroup}
                onCheckedChange={() => {
                  const filteredMuscleGroups = isSelected
                    ? selectedValues.filter((v) => v !== muscleGroup)
                    : [...selectedValues, muscleGroup];

                  updateTagsUrlParams(filteredMuscleGroups);
                  setLastOptionClicked(muscleGroup);
                }}
              >
                {isPending && lastOptionClicked === muscleGroup && (
                  <Loader className="mr-1 h-3 w-3" />
                )}
                {muscleGroup}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>

        {selectedValues.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => updateTagsUrlParams([])}
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
