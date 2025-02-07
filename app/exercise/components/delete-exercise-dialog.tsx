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
import { dashboardKeys } from "~/dashboard/dashboard.keys";
import { setKeys } from "~/set/set.keys";
import { getFirstDayOfMonth } from "~/utils/date";
import { transformSetsToHeatMap } from "~/set/set.services";

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
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  return useMutation({
    mutationFn: deleteExerciseAction,
    onMutate: (variables) => {
      const keys = {
        tiles: dashboardKeys.tiles(user.data.id).queryKey,
        setsHeatMap: setKeys.heatMap(user.data.id).queryKey,
        exercise: exerciseKeys.get(user.data.id, variables.data.exerciseId)
          .queryKey,
        exercisesFrequency: exerciseKeys.exercisesFrequency(user.data.id)
          .queryKey,
      } as const;

      queryClient.setQueryData(keys.tiles, (tiles) => {
        if (!tiles) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page) => {
            return {
              ...page,
              tiles: page.tiles.filter(
                (tile) => tile.exerciseId !== variables.data.exerciseId,
              ),
            };
          }),
        };
      });

      queryClient.setQueryData(keys.exercisesFrequency, (data) => {
        if (!data) {
          return data;
        }

        return data.filter((exercise) => {
          return exercise.id !== variables.data.exerciseId;
        });
      });

      queryClient.setQueryData(keys.setsHeatMap, (heatMapData) => {
        if (!heatMapData) {
          return heatMapData;
        }

        const setsForThisMonth = exercise.data.sets.filter((set) => {
          return (
            set.doneAt.getTime() >= getFirstDayOfMonth().getTime() &&
            set.doneAt.getTime() <= new Date().getTime()
          );
        });

        const exerciseSetsHeatMap = transformSetsToHeatMap(setsForThisMonth);

        return heatMapData.map((row) => {
          return {
            ...row,
            bins: row.bins.map((cell) => {
              const weekIndex = cell.weekIndex;
              const dayIndex = row.dayIndex;

              const exerciseCellCount =
                exerciseSetsHeatMap
                  .find((a) => a.dayIndex === dayIndex)
                  ?.bins.find((b) => b.weekIndex === weekIndex)?.count ?? 0;

              return {
                ...cell,
                count: cell.count - exerciseCellCount,
              };
            }),
          };
        });
      });

      queryClient.setQueryData(keys.exercise, undefined);
    },
    onSettled: (_data, _error, variables) => {
      const keys = {
        tiles: dashboardKeys.tiles(user.data.id),
        exercise: exerciseKeys.get(user.data.id, variables.data.exerciseId),
        exercisesFrequency: exerciseKeys.exercisesFrequency(user.data.id),
        setsHeatMap: setKeys.heatMap(user.data.id),
      } as const;

      void queryClient.invalidateQueries(keys.exercise);
      void queryClient.invalidateQueries(keys.tiles);
      void queryClient.invalidateQueries(keys.exercisesFrequency);
      void queryClient.invalidateQueries(keys.setsHeatMap);
    },
  });
};
