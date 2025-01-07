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
import { AddExerciseSetForm } from "~/exercise-set/components/add-exercise-set-form";

export const AddExerciseSetDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <span className="hidden sm:block">add new set</span>
          <Plus className="size-4 sm:hidden" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a new set</DialogTitle>
          <DialogDescription>Add a new set to the exercise</DialogDescription>
        </DialogHeader>

        <AddExerciseSetForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
