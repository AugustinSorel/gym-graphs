import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { useState } from "react";
import { Button } from "~/ui/button";
import { getRouteApi } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { CreateTeamForm } from "~/team/components/create-team-form";

export const CreateTeamDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  const search = apiRoute.useSearch();

  const isFiltering = Boolean(search.name);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button asChild className="hidden lg:inline-flex" disabled={isFiltering}>
        <DialogTrigger>create team</DialogTrigger>
      </Button>

      <Button
        asChild
        className="bg-primary/20 hover:bg-primary/30 text-primary fixed right-4 bottom-20 z-20 size-14 rounded-full border-2 border-current text-xl backdrop-blur-md lg:hidden"
        disabled={isFiltering}
        aria-label="create exercise"
      >
        <DialogTrigger>
          <Plus />
        </DialogTrigger>
      </Button>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create your team</DialogTitle>
          <DialogDescription>
            Create a new team to your profile here.
          </DialogDescription>
        </DialogHeader>

        <CreateTeamForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

const apiRoute = getRouteApi("/(teams)/teams");
