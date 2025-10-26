import { Button } from "~/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { CreateTagForm } from "~/domains/tag/components/create-tag-form";
import { Link } from "@tanstack/react-router";
import { useRouteHash } from "~/hooks/use-route-hash";

export const CreateTagDialog = () => {
  const routeHash = useRouteHash("add-tag");

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
          <Link hash={routeHash.hash} to=".">
            create tag
          </Link>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create tag</DialogTitle>
          <DialogDescription>
            Add a new exercise tag to your profile here.
          </DialogDescription>
        </DialogHeader>

        <CreateTagForm onSuccess={() => routeHash.remove()} />
      </DialogContent>
    </Dialog>
  );
};
