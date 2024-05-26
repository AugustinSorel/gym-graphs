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
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import type { ExerciseData } from "@/db/types";
import { api } from "@/trpc/react";

type Props = {
  exerciseData: ExerciseData;
};

export const DeleteDataAlertDialog = ({ exerciseData }: Props) => {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const { toast } = useToast();
  const utils = api.useUtils();

  const deleteExerciseData = api.exerciseData.delete.useMutation({
    onError: (error, variables) => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error.message,
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => deleteExerciseData.mutate(variables)}
          >
            Try again
          </ToastAction>
        ),
      });
    },
    onMutate: (variables) => {
      const cachedExercises = utils.exercise.all.getData();
      const cachedExercise = utils.exercise.get.getData({
        id: exerciseData.exerciseId,
      });

      if (!cachedExercise) {
        return;
      }

      utils.exercise.get.setData(
        { id: exerciseData.exerciseId },
        {
          ...cachedExercise,
          data: cachedExercise.data.filter(
            (exerciseData) => exerciseData.id !== variables.id,
          ),
        },
      );

      if (!cachedExercises) {
        return;
      }

      utils.exercise.all.setData(
        undefined,
        cachedExercises.map((exercise) => {
          if (exercise.id === exerciseData.exerciseId) {
            return {
              ...exercise,
              data: exercise.data.filter(
                (exerciseData) => exerciseData.id !== variables.id,
              ),
            };
          }

          return exercise;
        }),
      );

      setIsAlertDialogOpen(() => false);
    },
    onSettled: async () => {
      await utils.exercise.get.invalidate({ id: exerciseData.exerciseId });
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
          <span className="capitalize">delete data</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the data
            from your exercise
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="capitalize">cancel</AlertDialogCancel>
          <AlertDialogAction
            className="space-x-2 bg-destructive text-destructive-foreground hover:bg-destructive/80"
            disabled={deleteExerciseData.isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteExerciseData.mutate({ id: exerciseData.id });
            }}
          >
            {deleteExerciseData.isPending && <Loader />}
            <span className="capitalize">delete</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
