import { Button } from "~/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { CreateExerciseForm } from "~/exercise/components/create-exercise-form";
import { useState } from "react";
import { Plus } from "lucide-react";

export const CreateExerciseDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <span className="hidden sm:block">create exercise</span>
          <Plus className="size-4 sm:hidden" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create exercise</DialogTitle>
          <DialogDescription>
            Add a new exercise to your profile here.
          </DialogDescription>
        </DialogHeader>

        <CreateExerciseForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
