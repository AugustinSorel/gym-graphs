"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpdateExerciseNameDialog } from "../_modals/updateExerciseNameDialog";
import { DeleteExerciseAlertDialog } from "../_modals/deleteExerciseAlertDialog";
import {
  deleteExerciseAction,
  udpateExerciseTags,
  updateExerciseNameAction,
} from "@/serverActions/exercises";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import type { Exercise } from "@/db/types";
import type { PropsWithChildren } from "react";
import { muscleGroups } from "@/lib/muscleGroups";

type ExerciseTagsComboBoxProps = {
  exerciseId: Exercise["id"];
  exerciseMuscleGroups: NonNullable<Exercise["muscleGroups"]>;
} & PropsWithChildren;

export const ExerciseTagsComboBox = ({
  children,
  exerciseMuscleGroups,
  exerciseId,
}: ExerciseTagsComboBoxProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState(exerciseMuscleGroups);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">exercise tags</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search a muscle group..." />
          <CommandEmpty>No muscle group found.</CommandEmpty>
          <CommandGroup>
            {muscleGroups.map((tag) => {
              const isSelected = selectedTags.includes(tag);

              return (
                <CommandItem
                  key={tag}
                  onSelect={() => {
                    const filteredTags = isSelected
                      ? selectedTags.filter((v) => v !== tag)
                      : [...selectedTags, tag];

                    setSelectedTags(filteredTags);
                    void udpateExerciseTags(exerciseId, filteredTags);
                  }}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-border",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <CheckIcon className={cn("h-4 w-4")} />
                  </div>
                  <span>{tag}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
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
