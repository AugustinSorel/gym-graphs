import { Button } from "~/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { useState } from "react";
import { Plus } from "lucide-react";
import { RenameExerciseForm } from "./rename-exercise-form";

export const RenameExerciseDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <span className="hidden sm:block">rename</span>
          <Plus className="size-4 sm:hidden" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename exercise</DialogTitle>
          <DialogDescription>
            feel free to rename this exercise.
          </DialogDescription>
        </DialogHeader>

        <RenameExerciseForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
