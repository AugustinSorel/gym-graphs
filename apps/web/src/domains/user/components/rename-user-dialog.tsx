import { Button } from "~/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { RenameUserForm } from "~/domains/user/components/rename-user-form";
import { getRouteApi } from "@tanstack/react-router";
import { useRouteHash } from "~/hooks/use-route-hash";

export const RenameUserDialog = () => {
  const routeHash = useRouteHash("rename-user");

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
        <Button size="sm" asChild>
          <routeApi.Link hash={routeHash.hash}>rename</routeApi.Link>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename yourself</DialogTitle>
          <DialogDescription>
            feel free to rename yourself to a more confortable name.
          </DialogDescription>
        </DialogHeader>

        <RenameUserForm onSuccess={() => routeHash.remove()} />
      </DialogContent>
    </Dialog>
  );
};

const routeApi = getRouteApi("/(settings)/settings");
