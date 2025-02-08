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
import { exerciseQueries } from "~/exercise/exercise.queries";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { setQueries } from "~/set/set.queries";
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
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  return useMutation({
    mutationFn: deleteExerciseAction,
    onMutate: (variables) => {
      const queries = {
        tiles: dashboardQueries.tiles.queryKey,
        setsHeatMap: setQueries.heatMap.queryKey,
        funFacts: dashboardQueries.funFacts.queryKey,
        exercise: exerciseQueries.get(variables.data.exerciseId).queryKey,
        exercisesFrequency: exerciseQueries.exercisesFrequency.queryKey,
      } as const;

      queryClient.setQueryData(queries.tiles, (tiles) => {
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

      queryClient.setQueryData(queries.exercisesFrequency, (data) => {
        if (!data) {
          return data;
        }

        return data.filter((exercise) => {
          return exercise.id !== variables.data.exerciseId;
        });
      });

      queryClient.setQueryData(queries.funFacts, (funFacts) => {
        if (!funFacts) {
          return funFacts;
        }

        return {
          setsCount: funFacts.setsCount - exercise.data.sets.length,
          totalWeightInKg:
            funFacts.totalWeightInKg -
            exercise.data.sets.reduce((acc, curr) => {
              return acc + curr.weightInKg * curr.repetitions;
            }, 0),
          favoriteExercise:
            funFacts.favoriteExercise.name === exercise.data.name
              ? { name: "unkown" }
              : funFacts.favoriteExercise,
          leastFavoriteExercise:
            funFacts.leastFavoriteExercise.name === exercise.data.name
              ? { name: "unkown" }
              : funFacts.leastFavoriteExercise,
        };
      });

      queryClient.setQueryData(queries.setsHeatMap, (heatMapData) => {
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

      queryClient.setQueryData(queries.exercise, undefined);
    },
    onSettled: (_data, _error, variables) => {
      const queries = {
        tiles: dashboardQueries.tiles,
        exercise: exerciseQueries.get(variables.data.exerciseId),
        exercisesFrequency: exerciseQueries.exercisesFrequency,
        setsHeatMap: setQueries.heatMap,
        funFacts: dashboardQueries.funFacts,
      } as const;

      void queryClient.invalidateQueries(queries.exercise);
      void queryClient.invalidateQueries(queries.tiles);
      void queryClient.invalidateQueries(queries.exercisesFrequency);
      void queryClient.invalidateQueries(queries.setsHeatMap);
      void queryClient.invalidateQueries(queries.funFacts);
    },
  });
};
