import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "~/ui/alert-dialog";
import { Spinner } from "~/ui/spinner";
import { useUser } from "~/user/user.context";
import { useExerciseSet } from "~/exercise-set/exercise-set.context";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { deleteExerciseSetAction } from "../exercise-set.actions";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { useState } from "react";

export const DeleteExerciseSetDialog = () => {
  const exerciseSet = useExerciseSet();
  const deleteExerciseSet = useDeleteExerciseSet();
  const [isOpen, setIsOpen] = useState(false);

  const deleteExerciseHandler = () => {
    deleteExerciseSet.mutate(
      {
        data: {
          exerciseSetId: exerciseSet.id,
        },
      },
      {
        onSuccess: () => {
          setIsOpen(false);
        },
      },
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={(e) => e.preventDefault()}
        >
          delete set
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteExerciseSet.isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteExerciseHandler();
            }}
          >
            <span>Delete</span>
            {deleteExerciseSet.isPending && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const useDeleteExerciseSet = () => {
  const queryClient = useQueryClient();
  const user = useUser();
  const exerciseSet = useExerciseSet();

  return useMutation({
    mutationFn: deleteExerciseSetAction,
    onMutate: (variables) => {
      const keys = {
        all: exerciseKeys.all(user.id).queryKey,
        get: exerciseKeys.get(user.id, exerciseSet.exerciseId).queryKey,
      } as const;

      queryClient.setQueryData(keys.all, (exercises) => {
        if (!exercises) {
          return [];
        }

        return exercises.map((exercise) => {
          return {
            ...exercise,
            sets: exercise.sets.filter((set) => {
              return set.id !== variables.data.exerciseSetId;
            }),
          };
        });
      });

      queryClient.setQueryData(keys.get, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.filter((set) => {
            return set.id !== variables.data.exerciseSetId;
          }),
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries(exerciseKeys.all(user.id));
      void queryClient.invalidateQueries(
        exerciseKeys.get(user.id, exerciseSet.exerciseId),
      );
    },
  });
};
