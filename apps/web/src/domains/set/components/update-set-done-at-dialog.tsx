import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { UpdateSetDoneAtForm } from "~/domains/set/components/update-set-done-at-form";
import { getRouteApi } from "@tanstack/react-router";
import { useRouteHash } from "~/hooks/use-route-hash";

export const UpdateSetDoneAtDialog = () => {
  const routeHash = useRouteHash("update-done-at");

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
          <routeApi.Link hash={routeHash.hash}>update done at</routeApi.Link>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update done at</DialogTitle>
          <DialogDescription>
            feel free to update the done at date.
          </DialogDescription>
        </DialogHeader>

        <UpdateSetDoneAtForm onSuccess={() => routeHash.remove()} />
      </DialogContent>
    </Dialog>
  );
};

const routeApi = getRouteApi("/(exercises)/exercises/$exerciseId");
