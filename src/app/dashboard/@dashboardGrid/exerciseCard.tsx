import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpdateExerciseNameDialog } from "./updateExerciseNameDialog";
import { DeleteExerciseAlertDialog } from "./deleteExerciseAlertDialog";
import { deleteExerciseAction, updateExerciseNameAction } from "./actions";
import type { Exercise } from "@/fakeData";
import type { PropsWithChildren, ReactNode } from "react";
import { forwardRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  exerciseName:Exercise['name']
  dragComponent: ReactNode;
} & PropsWithChildren;

const ExerciseCard = forwardRef<HTMLLIElement, Props>(
  ({ exerciseName, dragComponent, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className="group relative flex h-exercise-card flex-col rounded-md border border-border bg-primary backdrop-blur-md hover:bg-border"
        {...props}
      >
        <Link
          href={`/exercises/${exerciseName}`}
          className="absolute inset-0 duration-300"
          aria-label={`go to exercise ${exerciseName}`}
        />

        <header className="flex items-center gap-2 border-b border-border bg-primary p-2">
          <p className="mr-auto truncate capitalize">{exerciseName}</p>

          <div className="z-10 transition-all duration-100 focus-within:opacity-100 group-hover:opacity-100 aria-[expanded=true]:opacity-100 sm:opacity-0">
            {dragComponent}
            <CardDropDown />
          </div>
        </header>

        {props.children}
      </li>
    );
  }
);
ExerciseCard.displayName = "exerciseCard";

export default ExerciseCard;

const CardDropDown = () => {
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                className="z-10 h-8 p-1"
                size="icon"
                variant="ghost"
                aria-label="view more about the exercise"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
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
          <UpdateExerciseNameDialog onAction={updateExerciseNameAction} />
          <DeleteExerciseAlertDialog onAction={deleteExerciseAction} />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
