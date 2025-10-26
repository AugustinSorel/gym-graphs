import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { CreateSetForm } from "~/domains/set/components/create-set-form";
import { Button } from "~/ui/button";
import { PlusIcon } from "~/ui/icons";
import { getRouteApi } from "@tanstack/react-router";
import { useRouteHash } from "~/hooks/use-route-hash";

export const CreateSetDialog = () => {
  const routeHash = useRouteHash("create-set");

  return (
    <Dialog
      open={routeHash.isActive}
      onOpenChange={(prev) => {
        if (!prev) {
          routeHash.remove();
        }
      }}
    >
      <Button asChild className="hidden lg:inline-flex" size="sm">
        <routeApi.Link hash={routeHash.hash}>create set</routeApi.Link>
      </Button>

      <Button
        asChild
        className="bg-primary/20 hover:bg-primary/30 text-primary fixed right-4 bottom-20 z-20 size-14 rounded-full border-2 border-current text-xl backdrop-blur-md lg:hidden"
        aria-label="create set"
      >
        <DialogTrigger>
          <PlusIcon />
        </DialogTrigger>
      </Button>

      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add a new set</DialogTitle>
          <DialogDescription>Add a new set to the exercise</DialogDescription>
        </DialogHeader>

        <CreateSetForm onSuccess={() => routeHash.remove()} />
      </DialogContent>
    </Dialog>
  );
};

const routeApi = getRouteApi("/(exercises)/exercises/$exerciseId");
