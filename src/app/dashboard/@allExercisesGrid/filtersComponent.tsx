"use client";

import type { Exercise } from "@/db/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { MuscleGroupsDropdown } from "../muscleGroupsDropdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

export const SearchFilter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [exerciseName, setExerciseName] = useState("");

  const updateExerciseNameUrlParams = (e: ChangeEvent<HTMLInputElement>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (!e.target.value) {
      current.delete("search");
    } else {
      current.set("search", e.target.value);
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";

    void router.push(`${pathname}${query}`);
  };

  return (
    <Input
      className="h-8 max-w-[10rem]"
      placeholder="filter exercises..."
      value={exerciseName}
      onChange={(e) => {
        updateExerciseNameUrlParams(e);
        setExerciseName(e.target.value);
      }}
    />
  );
};

export const MuscleGroupsFilter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tags = searchParams.get("tags");

  const [selectedValues, setSelectedValues] = useState(
    tags ? tags.split(",") : []
  );

  const updateTagsUrlParams = (muscleGroups: Exercise["muscleGroups"]) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (muscleGroups.length < 1) {
      current.delete("tags");
    } else {
      current.set("tags", muscleGroups.join(","));
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";

    void router.push(`${pathname}${query}`);
  };

  return (
    <MuscleGroupsDropdown
      selectedValues={selectedValues as Exercise["muscleGroups"]}
      updateValues={(values) => {
        setSelectedValues(values);
        updateTagsUrlParams(values);
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="relative h-8 p-1">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">tags</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </MuscleGroupsDropdown>
  );
};
