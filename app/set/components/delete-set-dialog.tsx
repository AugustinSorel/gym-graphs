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
import { useUser } from "~/user/hooks/use-user";
import { useSet } from "~/set/set.context";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { deleteSetAction } from "~/set/set.actions";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { useState } from "react";
import { dashboardKeys } from "~/dashboard/dashboard.keys";
import { setKeys } from "~/set/set.keys";
import { getCalendarPositions } from "~/utils/date";

export const DeleteSetDialog = () => {
  const set = useSet();
  const deleteSet = useDeleteSet();
  const [isOpen, setIsOpen] = useState(false);

  const deleteExerciseHandler = () => {
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
              deleteExerciseHandler();
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

const useDeleteSet = () => {
  const queryClient = useQueryClient();
  const user = useUser();
  const set = useSet();

  return useMutation({
    mutationFn: deleteSetAction,
    onMutate: (variables) => {
      const keys = {
        tiles: dashboardKeys.tiles(user.data.id).queryKey,
        exercise: exerciseKeys.get(user.data.id, set.exerciseId).queryKey,
        funFacts: dashboardKeys.funFacts(user.data.id).queryKey,
        setsHeatMap: setKeys.heatMap(user.data.id).queryKey,
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

      queryClient.setQueryData(keys.funFacts, (funFacts) => {
        if (!funFacts) {
          return funFacts;
        }

        return {
          ...funFacts,
          setsCount: funFacts.setsCount - 1,
          totalWeightInKg:
            funFacts.totalWeightInKg - set.weightInKg * set.repetitions,
        };
      });

      queryClient.setQueryData(keys.setsHeatMap, (setsHeatMap) => {
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

      queryClient.setQueryData(keys.exercise, (exercise) => {
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
      const keys = {
        exercise: exerciseKeys.get(user.data.id, set.exerciseId),
        tiles: dashboardKeys.tiles(user.data.id),
        setsHeatMap: setKeys.heatMap(user.data.id),
        funFacts: dashboardKeys.funFacts(user.data.id),
      } as const;

      void queryClient.invalidateQueries(keys.tiles);
      void queryClient.invalidateQueries(keys.exercise);
      void queryClient.invalidateQueries(keys.setsHeatMap);
      void queryClient.invalidateQueries(keys.funFacts);
    },
  });
};
