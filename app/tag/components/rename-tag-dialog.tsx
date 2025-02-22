import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { useState } from "react";
import { RenameTagForm } from "~/tag/components/rename-tag-form";
import { DropdownMenuItem } from "~/ui/dropdown-menu";

export const RenameTagDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          rename
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename tag</DialogTitle>
          <DialogDescription>Feel free to rename your tag.</DialogDescription>
        </DialogHeader>

        <RenameTagForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
