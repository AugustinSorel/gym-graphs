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
import { UpdateSetWeightForm } from "~/set/components/update-set-weight-form";

export const UpdateSetWeightDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          update weight
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update weight</DialogTitle>
          <DialogDescription>
            feel free to update the weight lifted.
          </DialogDescription>
        </DialogHeader>

        <UpdateSetWeightForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
