import { Button } from "~/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog";
import { CreateExerciseTileForm } from "~/dashboard/components/create-exercise-tile-form";
import { useState } from "react";
import { Plus } from "lucide-react";
import { getRouteApi } from "@tanstack/react-router";

export const CreateExerciseTileDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const search = routeApi.useSearch();

  const isFiltering = Boolean(search.name || search.tags?.length);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button aria-label="create exercise" disabled={isFiltering}>
          <span className="hidden sm:block">create exercise</span>
          <Plus className="size-4 sm:hidden" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create exercise</DialogTitle>
          <DialogDescription>
            Add a new exercise to your profile here.
          </DialogDescription>
        </DialogHeader>

        <CreateExerciseTileForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

const routeApi = getRouteApi("/dashboard/");
