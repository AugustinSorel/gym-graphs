import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { CreateExerciseOverviewTileForm } from "~/domains/tile/components/create-exercise-overview-tile-form";
import { Button } from "~/ui/button";
import { getRouteApi } from "@tanstack/react-router";
import { PlusIcon } from "~/ui/icons";
import { useRouteHash } from "~/hooks/use-route-hash";

export const CreateExerciseOverviewTileDialog = () => {
  const routeHash = useRouteHash("create-exercise-overview-tile");
  const search = routeApi.useSearch();

  const isFiltering = Boolean(search.name ?? search.tags?.length);

  return (
    <Dialog
      open={routeHash.isActive}
      onOpenChange={(prev) => {
        if (!prev) {
          routeHash.remove();
        }
      }}
    >
      <Button asChild className="hidden lg:inline-flex" disabled={isFiltering}>
        <routeApi.Link hash={routeHash.hash}>create exercise</routeApi.Link>
      </Button>

      <Button
        asChild
        className="bg-primary/20 hover:bg-primary/30 text-primary fixed right-4 bottom-20 z-20 size-14 rounded-full border-2 border-current text-xl backdrop-blur-md lg:hidden"
        disabled={isFiltering}
        aria-label="create exercise"
      >
        <DialogTrigger asChild>
          <routeApi.Link hash={routeHash.hash}>
            <PlusIcon />
          </routeApi.Link>
        </DialogTrigger>
      </Button>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create exercise</DialogTitle>
          <DialogDescription>
            Add a new exercise to your profile here.
          </DialogDescription>
        </DialogHeader>

        <CreateExerciseOverviewTileForm onSuccess={() => routeHash.remove()} />
      </DialogContent>
    </Dialog>
  );
};

const routeApi = getRouteApi("/(dashboard)/dashboard");
