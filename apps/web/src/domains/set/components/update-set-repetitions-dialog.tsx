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
import { UpdateSetRepetitionsForm } from "~/domains/set/components/update-set-repetitions-form";

export const UpdateSetRepetitionsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          update repetitions
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Update repetitions</DialogTitle>
          <DialogDescription>
            feel free to update the repetitions.
          </DialogDescription>
        </DialogHeader>

        <UpdateSetRepetitionsForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
