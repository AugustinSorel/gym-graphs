import { useMutation } from "@tanstack/react-query";
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
import { useSet } from "~/domains/set/set.context";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { useState } from "react";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { getRouteApi } from "@tanstack/react-router";
import { api, parseJsonResponse } from "~/libs/api";
import { InferRequestType } from "hono";
import { tileQueries } from "~/domains/tile/tile.queries";

export const DeleteSetDialog = () => {
  const set = useSet();
  const deleteSet = useDeleteSet();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);
  const [isOpen, setIsOpen] = useState(false);

  const deleteSetHandler = () => {
    deleteSet.mutate(
      {
        param: {
          setId: set.id.toString(),
          exerciseId: exercise.data.id.toString(),
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

const routeApi = getRouteApi("/(exercises)/exercises/$exerciseId");

const useDeleteSet = () => {
  const set = useSet();
  const req = api().exercises[":exerciseId"].sets[":setId"].$delete;

  const queries = {
    tiles: tileQueries.all(),
    exercise: exerciseQueries.get(set.exerciseId),
  };

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: (variables, ctx) => {
      ctx.client.setQueryData(queries.tiles.queryKey, (tiles) => {
        if (!tiles) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page) => {
            return {
              ...page,
              tiles: page.tiles.map((tile) => {
                if (tile.type !== "exerciseOverview") {
                  return tile;
                }

                return {
                  ...tile,
                  exerciseOverview: {
                    ...tile.exerciseOverview,
                    exercise: {
                      ...tile.exerciseOverview.exercise,
                      sets: tile.exerciseOverview.exercise.sets.filter(
                        (set) => {
                          return set.id.toString() !== variables.param.setId;
                        },
                      ),
                    },
                  },
                };
              }),
            };
          }),
        };
      });

      ctx.client.setQueryData(queries.exercise.queryKey, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.filter((set) => {
            return set.id.toString() !== variables.param.setId;
          }),
        };
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};
