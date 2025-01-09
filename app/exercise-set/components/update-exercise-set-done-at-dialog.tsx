import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { useState } from "react";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { UpdateExerciseSetDoneAtForm } from "./update-exercise-set-done-at-form";

export const UpdateExerciseSetDoneAtDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          update done at
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update done at</DialogTitle>
          <DialogDescription>
            feel free to update the done at date.
          </DialogDescription>
        </DialogHeader>

        <UpdateExerciseSetDoneAtForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
