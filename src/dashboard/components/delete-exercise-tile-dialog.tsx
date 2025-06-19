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
import { exerciseQueries } from "~/exercise/exercise.queries";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { getFirstDayOfMonth } from "~/utils/date";
import { transformSetsToHeatMap } from "~/set/set.services";
import { deleteTileAction } from "~/dashboard/dashboard.actions";

export const DeleteExerciseTileDialog = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = useNavigate();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);
  const deleteExerciseTile = useDeleteExerciseTile();

  const deleteExerciseTileHandler = () => {
    deleteExerciseTile.mutate(
      {
        data: {
          tileId: exercise.data.tile.id,
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
            disabled={deleteExerciseTile.isPending || isRedirectPending}
            onClick={(e) => {
              e.preventDefault();
              deleteExerciseTileHandler();
            }}
          >
            <span>Delete</span>
            {(deleteExerciseTile.isPending || isRedirectPending) && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const routeApi = getRouteApi("/(exercises)/exercises_/$exerciseId/settings");

const useDeleteExerciseTile = () => {
  const queryClient = useQueryClient();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);

  return useMutation({
    mutationFn: deleteTileAction,
    onMutate: (variables) => {
      const queries = {
        tiles: dashboardQueries.tiles().queryKey,
        setsHeatMap: dashboardQueries.tilesSetsHeatMap.queryKey,
        funFacts: dashboardQueries.funFacts.queryKey,
        exercise: exerciseQueries.get(exercise.data.id),
        tilesToSetsCount: dashboardQueries.tilesToSetsCount.queryKey,
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
                (tile) => tile.id !== variables.data.tileId,
              ),
            };
          }),
        };
      });

      queryClient.setQueryData(queries.tilesToSetsCount, (tilesToSetsCount) => {
        if (!tilesToSetsCount) {
          return tilesToSetsCount;
        }

        return tilesToSetsCount.filter((tile) => {
          return tile.name !== exercise.data.tile.name;
        });
      });

      queryClient.setQueryData(queries.funFacts, (funFacts) => {
        if (!funFacts) {
          return funFacts;
        }

        return {
          totalRepetitions:
            funFacts.totalRepetitions -
            exercise.data.sets.reduce((acc, curr) => {
              return acc + curr.repetitions;
            }, 0),
          totalWeightInKg:
            funFacts.totalWeightInKg -
            exercise.data.sets.reduce((acc, curr) => {
              return acc + curr.weightInKg * curr.repetitions;
            }, 0),
          tileWithMostSets:
            funFacts.tileWithMostSets.name === exercise.data.tile.name
              ? { name: "unkown", setsCount: 0 }
              : funFacts.tileWithMostSets,
          tileWithLeastSets:
            funFacts.tileWithLeastSets.name === exercise.data.tile.name
              ? { name: "unkown", setsCount: 0 }
              : funFacts.tileWithLeastSets,
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

      queryClient.removeQueries(queries.exercise);
    },
    onSettled: () => {
      const queries = {
        tiles: dashboardQueries.tiles(),
        exercise: exerciseQueries.get(exercise.data.id),
        tilesToSetsCount: dashboardQueries.tilesToSetsCount,
        setsHeatMap: dashboardQueries.tilesSetsHeatMap,
        funFacts: dashboardQueries.funFacts,
      } as const;

      void queryClient.invalidateQueries(queries.exercise);
      void queryClient.invalidateQueries(queries.tiles);
      void queryClient.invalidateQueries(queries.tilesToSetsCount);
      void queryClient.invalidateQueries(queries.setsHeatMap);
      void queryClient.invalidateQueries(queries.funFacts);
    },
  });
};
