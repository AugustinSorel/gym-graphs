import { Button } from "~/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { RenameExerciseOverviewTileForm } from "~/domains/tile/components/rename-exercise-overview-tile-form";
import { useRouteHash } from "~/hooks/use-route-hash";
import { getRouteApi } from "@tanstack/react-router";

export const RenameExerciseOverviewTileDialog = () => {
  const routeHash = useRouteHash("rename-exercise-overview-tile");

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

        <RenameExerciseOverviewTileForm onSuccess={() => routeHash.remove()} />
      </DialogContent>
    </Dialog>
  );
};

const routeApi = getRouteApi("/(exercises)/exercises_/$exerciseId/settings");
