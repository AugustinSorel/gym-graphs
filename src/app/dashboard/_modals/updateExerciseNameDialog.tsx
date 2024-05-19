"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Edit2 } from "lucide-react";
import type { Exercise } from "@/db/types";
import { api } from "@/trpc/react";

type Props = {
  exercise: Exercise;
};

export const UpdateExerciseNameDialog = ({ exercise }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatedExerciseName, setUpdatedExerciseName] = useState(exercise.name);
  const { toast } = useToast();

  //TODO:performance
  const updateExercise = api.exercise.update.useMutation({
    onSuccess: () => {
      setIsDialogOpen(false);
    },
    onError: (error, variables) => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error.message,
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => updateExercise.mutate(variables)}
          >
            Try again
          </ToastAction>
        ),
      });
    },
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit2 className="mr-2 h-4 w-4" />
          <span className="capitalize">rename</span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">change exercise name</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();

            updateExercise.mutate({
              id: exercise.id,
              name: updatedExerciseName,
            });
          }}
        >
          <Label htmlFor="name" className="capitalize">
            exercise name
          </Label>
          <Input
            id="name"
            value={updatedExerciseName}
            onChange={(e) => setUpdatedExerciseName(e.target.value)}
          />

          <Button
            className="ml-auto space-x-2"
            disabled={updateExercise.isPending}
          >
            {updateExercise.isPending && <Loader />}
            <span className="capitalize">save change</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
