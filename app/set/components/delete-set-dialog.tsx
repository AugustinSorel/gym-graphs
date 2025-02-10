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
import { useSet } from "~/set/set.context";
import { exerciseQueries } from "~/exercise/exercise.queries";
import { deleteSetAction } from "~/set/set.actions";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { useState } from "react";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { getCalendarPositions } from "~/utils/date";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { getRouteApi } from "@tanstack/react-router";

export const DeleteSetDialog = () => {
  const set = useSet();
  const deleteSet = useDeleteSet();
  const [isOpen, setIsOpen] = useState(false);

  const deleteSetHandler = () => {
    deleteSet.mutate(
      {
        data: {
          setId: set.id,
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
            disabled={deleteSet.isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteSetHandler();
            }}
          >
            <span>Delete</span>
            {deleteSet.isPending && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const routeApi = getRouteApi("/exercises/$exerciseId");

const useDeleteSet = () => {
  const queryClient = useQueryClient();
  const set = useSet();
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  return useMutation({
    mutationFn: deleteSetAction,
    onMutate: (variables) => {
      const queries = {
        tiles: dashboardQueries.tiles.queryKey,
        exercise: exerciseQueries.get(set.exerciseId).queryKey,
        funFacts: dashboardQueries.funFacts.queryKey,
        setsHeatMap: dashboardQueries.tilesSetsHeatMap.queryKey,
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
              tiles: page.tiles.map((tile) => {
                if (!tile.exercise) {
                  return tile;
                }

                return {
                  ...tile,
                  exercise: {
                    ...tile.exercise,
                    sets: tile.exercise.sets.filter((set) => {
                      return set.id !== variables.data.setId;
                    }),
                  },
                };
              }),
            };
          }),
        };
      });

      queryClient.setQueryData(queries.tilesToSetsCount, (tilesToSetsCount) => {
        if (!tilesToSetsCount) {
          return tilesToSetsCount;
        }

        return tilesToSetsCount.map((tile) => {
          if (tile.name === exercise.data.tile.name) {
            return {
              ...tile,
              count: tile.count - 1,
            };
          }

          return tile;
        });
      });

      queryClient.setQueryData(queries.funFacts, (funFacts) => {
        if (!funFacts) {
          return funFacts;
        }

        return {
          ...funFacts,
          totalRepetitions: funFacts.totalRepetitions - set.repetitions,
          totalWeightInKg:
            funFacts.totalWeightInKg - set.weightInKg * set.repetitions,
        };
      });

      queryClient.setQueryData(queries.setsHeatMap, (setsHeatMap) => {
        if (!setsHeatMap) {
          return setsHeatMap;
        }

        const calendarPositions = getCalendarPositions(set.doneAt);

        return setsHeatMap.map((row) => {
          if (row.dayIndex === calendarPositions.day) {
            return {
              ...row,
              bins: row.bins.map((cell) => {
                if (cell.weekIndex === calendarPositions.week) {
                  return {
                    ...cell,
                    count: cell.count - 1,
                  };
                }
                return cell;
              }),
            };
          }

          return row;
        });
      });

      queryClient.setQueryData(queries.exercise, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.filter((set) => {
            return set.id !== variables.data.setId;
          }),
        };
      });
    },
    onSettled: () => {
      const queries = {
        exercise: exerciseQueries.get(set.exerciseId),
        tiles: dashboardQueries.tiles,
        setsHeatMap: dashboardQueries.tilesSetsHeatMap,
        funFacts: dashboardQueries.funFacts,
        tilesToSetsCount: dashboardQueries.tilesToSetsCount,
      } as const;

      void queryClient.invalidateQueries(queries.tiles);
      void queryClient.invalidateQueries(queries.exercise);
      void queryClient.invalidateQueries(queries.setsHeatMap);
      void queryClient.invalidateQueries(queries.funFacts);
      void queryClient.invalidateQueries(queries.tilesToSetsCount);
    },
  });
};
