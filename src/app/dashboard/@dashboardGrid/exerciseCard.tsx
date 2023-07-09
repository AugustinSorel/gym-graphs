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
import { CardGraph } from "./cardGraph";
import type { Exercise } from "@/fakeData";
import type { ReactNode } from "react";
import { forwardRef } from "react";

type Props = {
  exercise: Exercise;
  dragComponent: ReactNode;
};

const ExerciseCard = forwardRef<HTMLLIElement, Props>(
  ({ exercise, dragComponent, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className="group relative flex h-exercise-card flex-col rounded-md border border-border bg-primary backdrop-blur-md hover:bg-border"
        {...props}
      >
        <Link
          href={`/exercises/${exercise.name}`}
          className="absolute inset-0 duration-300"
          aria-label={`go to exercise ${exercise.name}`}
        />

        <header className="flex items-center gap-2 border-b border-border bg-primary p-2">
          <p className="mr-auto truncate capitalize">{exercise.name}</p>

          <div className="z-10 transition-all duration-100 group-hover:opacity-100 aria-[expanded=true]:opacity-100 sm:opacity-0">
            {dragComponent}
            <CardDropDown />
          </div>
        </header>

        <CardGraph data={exercise.data} />
      </li>
    );
  }
);
ExerciseCard.displayName = "exerciseCard";

export default ExerciseCard;

const CardDropDown = () => {
  return (
    <DropdownMenu>
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
