"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash } from "lucide-react";
import type { Exercise } from "@/server/db/types";
import { api } from "@/trpc/react";
import { Loader } from "@/components/ui/loader";

type Props = {
  exercise: Exercise;
};

export const DeleteExerciseAlertDialog = ({ exercise }: Props) => {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const utils = api.useUtils();

  const deleteExercise = api.exercise.delete.useMutation({
    onSuccess: () => {
      setIsAlertDialogOpen(false);
    },
    onMutate: (exerciseToDelete) => {
      const allExercises = utils.exercise.all.getData();
      const exerciseCached = utils.exercise.get.getData({ id: exercise.id });

      if (!allExercises) {
        return;
      }

      utils.exercise.all.setData(
        undefined,
        allExercises.filter((x) => x.id !== exerciseToDelete.id),
      );

      if (!exerciseCached) {
        return;
      }

      utils.exercise.get.setData({ id: exercise.id }, undefined);
    },
    onSettled: () => {
      void utils.exercise.all.invalidate();
    },
  });

  return (
    <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive/80 focus:bg-destructive/20 focus:text-destructive"
          onSelect={(e) => e.preventDefault()}
        >
          <Trash className="mr-2 h-4 w-4" />
          <span className="capitalize">delete exercise</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <strong>{exercise.name}</strong> from your exercise list
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="capitalize">cancel</AlertDialogCancel>
          <AlertDialogAction
            className="space-x-2 bg-destructive text-destructive-foreground hover:bg-destructive/80"
            disabled={deleteExercise.isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteExercise.mutate({ id: exercise.id });
            }}
          >
            {deleteExercise.isPending && <Loader />}
            <span className="capitalize">delete</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
