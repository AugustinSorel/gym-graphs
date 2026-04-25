import { Button } from "~/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { RenameExerciseForm } from "~/domains/exercise/components/rename-exercise-form";
import { useRouteHash } from "~/hooks/use-route-hash";
import { getRouteApi } from "@tanstack/react-router";

export const RenameExerciseDialog = () => {
  const routeHash = useRouteHash("rename-exercise");

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
          <DialogTitle>Rename exercise</DialogTitle>
          <DialogDescription>
            feel free to rename this exercise.
          </DialogDescription>
        </DialogHeader>

        <RenameExerciseForm onSuccess={() => routeHash.remove()} />
      </DialogContent>
    </Dialog>
  );
};

const routeApi = getRouteApi("/(authed)/exercises/$exerciseId/settings");
