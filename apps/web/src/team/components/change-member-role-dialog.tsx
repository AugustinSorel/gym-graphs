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
import { ChangeMemberRoleForm } from "~/team/components/change-member-role-form";

export const ChangeMemberRoleDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          change role
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            feel free to change this member's role
          </DialogDescription>
        </DialogHeader>

        <ChangeMemberRoleForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
