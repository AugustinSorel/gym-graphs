import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { UpdateSetRepetitionsForm } from "~/domains/set/components/update-set-repetitions-form";
import { getRouteApi } from "@tanstack/react-router";
import { useRouteHash } from "~/hooks/use-route-hash";
import { useSet } from "~/domains/set/set.context";

export const UpdateSetRepetitionsDialog = () => {
  const set = useSet();
  const routeHash = useRouteHash(`update-repetitions-${set.id}`);

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
          <routeApi.Link hash={routeHash.hash}>
            update repetitions
          </routeApi.Link>
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

        <UpdateSetRepetitionsForm onSuccess={() => routeHash.remove()} />
      </DialogContent>
    </Dialog>
  );
};

const routeApi = getRouteApi("/(exercises)/exercises/$exerciseId");
