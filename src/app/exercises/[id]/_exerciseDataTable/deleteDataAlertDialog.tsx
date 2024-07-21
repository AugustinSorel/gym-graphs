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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash } from "lucide-react";
import { api, type RouterOutputs } from "@/trpc/react";

type Props = {
  exerciseData: RouterOutputs["exercise"]["get"]["data"][number];
};

export const DeleteDataAlertDialog = ({ exerciseData }: Props) => {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const utils = api.useUtils();

  const deleteExerciseData = api.exerciseData.delete.useMutation({
    onSuccess: () => {
      setIsAlertDialogOpen(() => false);
    },
    onMutate: async (variables) => {
      await utils.exercise.all.cancel();
      await utils.exercise.get.cancel({ id: exerciseData.exerciseId });
      await utils.user.get.cancel();

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
    },
    onSettled: () => {
      void utils.exercise.get.invalidate({ id: exerciseData.exerciseId });
      void utils.exercise.all.invalidate();
      void utils.user.get.invalidate();
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
