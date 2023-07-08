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
import { CardGraph } from "./CardGraph";
import type { Exercise } from "@/fakeData";

const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  return (
    <li className="group relative flex h-exercise-card flex-col overflow-hidden rounded-md border border-border bg-primary backdrop-blur-md duration-300 hover:scale-[1.02] hover:bg-border">
      <Link
        href={`/exercises/${exercise.name}`}
        className="absolute inset-0 duration-300"
        aria-label={`go to exercise ${exercise.name}`}
      />

      <header className="z-10 flex items-center justify-between gap-2 border-b border-border bg-primary p-2">
        <p className="truncate capitalize">{exercise.name}</p>

        <CardDropDown />
      </header>

      <CardGraph data={exercise.data} />
    </li>
  );
};

export default ExerciseCard;

const CardDropDown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-8 p-1 opacity-0 transition-all duration-100 group-focus-within:opacity-100 group-hover:opacity-100 aria-[expanded=true]:opacity-100"
          size="icon"
          variant="ghost"
          aria-label="view more about the exercise bench press"
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