import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { Button } from "~/ui/button";
import { getRouteApi } from "@tanstack/react-router";
import { PlusIcon } from "~/ui/icons";
import { CreateTeamForm } from "~/domains/team/components/create-team-form";
import { useRouteHash } from "~/hooks/use-route-hash";

export const CreateTeamDialog = () => {
  const routeHash = useRouteHash("create-team");

  const search = routeApi.useSearch();

  const isFiltering = Boolean(search.name);

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
        <DialogTrigger asChild>
          <routeApi.Link hash={routeHash.hash}>create team</routeApi.Link>
        </DialogTrigger>
      </Button>

      <Button
        asChild
        className="bg-primary/20 hover:bg-primary/30 text-primary fixed right-4 bottom-20 z-20 size-14 rounded-full border-2 border-current text-xl backdrop-blur-md lg:hidden"
        disabled={isFiltering}
        aria-label="create exercise"
      >
        <DialogTrigger>
          <PlusIcon />
        </DialogTrigger>
      </Button>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create your team</DialogTitle>
          <DialogDescription>
            Create a new team to your profile here.
          </DialogDescription>
        </DialogHeader>

        <CreateTeamForm onSuccess={() => routeHash.remove()} />
      </DialogContent>
    </Dialog>
  );
};

const routeApi = getRouteApi("/(teams)/teams");
