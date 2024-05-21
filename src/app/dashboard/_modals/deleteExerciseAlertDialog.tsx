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
import { ToastAction } from "@/components/ui/toast";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash } from "lucide-react";
import type { Exercise } from "@/db/types";
import { api } from "@/trpc/react";

type Props = {
  exercise: Exercise;
};

export const DeleteExerciseAlertDialog = ({ exercise }: Props) => {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const { toast } = useToast();
  const utils = api.useUtils();

  const deleteExercise = api.exercise.delete.useMutation({
    onError: (error, variables) => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error.message,
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => deleteExercise.mutate(variables)}
          >
            Try again
          </ToastAction>
        ),
      });
    },
    onMutate: (exerciseToDelete) => {
      const allExercises = utils.exercise.all.getData();

      if (!allExercises) {
        return;
      }

      utils.exercise.all.setData(
        undefined,
        allExercises.filter((x) => x.id !== exerciseToDelete.id),
      );

      setIsAlertDialogOpen(false);
    },
    onSettled: async () => {
      await utils.exercise.all.invalidate();
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
            onClick={(e) => {
              e.preventDefault();
              deleteExercise.mutate({ id: exercise.id });
            }}
          >
            <span className="capitalize">delete</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
