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
import { RenameExerciseOverviewTileForm } from "~/domains/tile/components/rename-exercise-overview-tile-form";

export const RenameExerciseOverviewTileDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">rename</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename exercise</DialogTitle>
          <DialogDescription>
            feel free to rename this exercise.
          </DialogDescription>
        </DialogHeader>

        <RenameExerciseOverviewTileForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
