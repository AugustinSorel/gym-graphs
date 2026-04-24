import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
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
import { getRouteApi } from "@tanstack/react-router";
import { useTransition } from "react";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { callApi, InferApiProps } from "~/libs/api";
import { useRouteHash } from "~/hooks/use-route-hash";

export const DeleteExerciseDialog = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = routeApi.useNavigate();
  const params = routeApi.useParams();
  const exercise = useSuspenseQuery(exerciseQueries.get(params.exerciseId));
  const deleteExercise = useDeleteExercise();
  const routeHash = useRouteHash("delete-exercise");

  const deleteExerciseHandler = () => {
    deleteExercise.mutate(
      {
        path: {
          exerciseId: exercise.data.id,
        },
      },
      {
        onSuccess: () => {
          startRedirectTransition(async () => {
            await navigate({ to: "/exercises" });
          });
        },
      },
    );
  };

  return (
    <AlertDialog
      open={routeHash.isActive}
      onOpenChange={(prev) => {
        if (!prev) {
          routeHash.remove();
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" asChild>
          <routeApi.Link hash={routeHash.hash}>delete</routeApi.Link>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            exercise and remove all of its data from our servers.
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

const routeApi = getRouteApi("/(authed)/exercises/$exerciseId/settings");

const useDeleteExercise = () => {
  const params = routeApi.useParams();
  const exercise = useSuspenseQuery(exerciseQueries.get(params.exerciseId));

  const queries = {
    exercises: exerciseQueries.all(),
    exercise: exerciseQueries.get(exercise.data.id),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"Exercise", "delete">) => {
      return callApi((api) => api.Exercise.delete(props));
    },
    onMutate: async (variables, ctx) => {
      await Promise.all([
        ctx.client.cancelQueries(queries.exercises),
        ctx.client.cancelQueries(queries.exercise),
      ]);

      const oldExercises = ctx.client.getQueryData(queries.exercises.queryKey);
      const oldExercise = ctx.client.getQueryData(queries.exercise.queryKey);

      ctx.client.setQueryData(queries.exercises.queryKey, (exercises) => {
        if (!exercises) {
          return exercises;
        }

        return {
          ...exercises,
          pages: exercises.pages.map((page) => ({
            ...page,
            exercises: page.exercises.filter((exercise) => {
              return exercise.id !== variables.path.exerciseId;
            }),
          })),
        };
      });

      ctx.client.setQueryData(queries.exercise.queryKey, undefined);

      return { oldExercises, oldExercise };
    },
    onError: (_e, _variables, res, ctx) => {
      ctx.client.setQueryData(queries.exercises.queryKey, res?.oldExercises);
      ctx.client.setQueryData(queries.exercise.queryKey, res?.oldExercise);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.exercises);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};
