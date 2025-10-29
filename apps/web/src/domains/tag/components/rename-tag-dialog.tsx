import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { RenameTagForm } from "~/domains/tag/components/rename-tag-form";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { getRouteApi } from "@tanstack/react-router";
import { useRouteHash } from "~/hooks/use-route-hash";

export const RenameTagDialog = () => {
  const routeHash = useRouteHash("rename-tag");

  return (
    <Dialog
      open={routeHash.isActive}
      onOpenChange={(prev) => {
        if (!prev) {
          routeHash.remove();
        }
      }}
    >
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
          <routeApi.Link hash={routeHash.hash}>rename</routeApi.Link>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename tag</DialogTitle>
          <DialogDescription>Feel free to rename your tag.</DialogDescription>
        </DialogHeader>

        <RenameTagForm onSuccess={() => routeHash.remove()} />
      </DialogContent>
    </Dialog>
  );
};

const routeApi = getRouteApi("/(settings)/settings");
