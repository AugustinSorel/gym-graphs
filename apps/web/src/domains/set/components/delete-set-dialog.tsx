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
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { getRouteApi } from "@tanstack/react-router";
import { api, parseJsonResponse } from "~/libs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import type { InferRequestType } from "hono";
import { useRouteHash } from "~/hooks/use-route-hash";

export const DeleteSetDialog = () => {
  const set = useSet();
  const deleteSet = useDeleteSet();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);
  const routeHash = useRouteHash("delete-set");

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
          routeHash.remove();
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
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={(e) => e.preventDefault()}
          asChild
        >
          <routeApi.Link hash={routeHash.hash}>delete set</routeApi.Link>
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
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.tiles);
      await ctx.client.cancelQueries(queries.exercise);

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
