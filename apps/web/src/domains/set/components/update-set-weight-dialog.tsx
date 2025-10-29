import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { UpdateSetWeightForm } from "~/domains/set/components/update-set-weight-form";
import { getRouteApi } from "@tanstack/react-router";
import { useRouteHash } from "~/hooks/use-route-hash";

export const UpdateSetWeightDialog = () => {
  const routeHash = useRouteHash("update-weight");

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
          <routeApi.Link hash={routeHash.hash}>update weight</routeApi.Link>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Update weight</DialogTitle>
          <DialogDescription>
            feel free to update the weight lifted.
          </DialogDescription>
        </DialogHeader>

        <UpdateSetWeightForm onSuccess={() => routeHash.remove()} />
      </DialogContent>
    </Dialog>
  );
};

const routeApi = getRouteApi("/(exercises)/exercises/$exerciseId");
