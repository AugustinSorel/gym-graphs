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
import { Button } from "~/ui/button";
import { Spinner } from "~/ui/spinner";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";
import { deleteExerciseAction } from "~/exercise/exercise.actions";
import { useUser } from "~/user/hooks/use-user";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { userKeys } from "~/user/user.key";

export const DeleteExerciseDialog = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = useNavigate();
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });
  const deleteExercise = useDeleteExercise();

  const deleteExerciseHandler = () => {
    deleteExercise.mutate(
      {
        data: {
          exerciseId: exercise.data.id,
        },
      },
      {
        onSuccess: () => {
          startRedirectTransition(async () => {
            await navigate({ to: "/dashboard" });
          });
        },
      },
    );
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          delete
        </Button>
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
            disabled={deleteExercise.isPending || isRedirectPending}
            onClick={(e) => {
              e.preventDefault();
              deleteExerciseHandler();
            }}
          >
            <span>Delete</span>
            {(deleteExercise.isPending || isRedirectPending) && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const routeApi = getRouteApi("/exercises_/$exerciseId/settings");

const useDeleteExercise = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: deleteExerciseAction,
    onMutate: (variables) => {
      const keys = {
        exercises: exerciseKeys.all(user.data.id).queryKey,
        exercise: exerciseKeys.get(user.data.id, variables.data.exerciseId)
          .queryKey,
        user: userKeys.get.queryKey,
      } as const;

      queryClient.setQueryData(keys.exercises, (exercises) => {
        if (!exercises) {
          return [];
        }

        return exercises.filter((exercise) => {
          return exercise.id !== variables.data.exerciseId;
        });
      });

      queryClient.setQueryData(keys.user, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          dashboardTiles: user.dashboardTiles.filter(
            (tile) => tile.exerciseId !== variables.data.exerciseId,
          ),
        };
      });

      queryClient.setQueryData(keys.exercise, undefined);
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries(exerciseKeys.all(user.data.id));
      void queryClient.invalidateQueries(userKeys.get);
      void queryClient.invalidateQueries(
        exerciseKeys.get(user.data.id, variables.data.exerciseId),
      );
    },
  });
};
