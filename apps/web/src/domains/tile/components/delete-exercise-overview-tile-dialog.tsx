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
import { tileQueries } from "~/domains/tile/tile.queries";
import { useRouteHash } from "~/hooks/use-route-hash";

export const DeleteExerciseOverviewTileDialog = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = routeApi.useNavigate();
  const params = routeApi.useParams();
  const exercise = useSuspenseQuery(exerciseQueries.get(params.exerciseId));
  const deleteExerciseTile = useDeleteExerciseTile();
  const routeHash = useRouteHash("delete-exercise-overview-tile");

  const deleteExerciseTileHandler = () => {
    deleteExerciseTile.mutate(
      {
        path: {
          tileId: exercise.data.tileId,
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

const routeApi = getRouteApi("/(authed)/exercises/$exerciseId/settings");

const useDeleteExerciseTile = () => {
  const params = routeApi.useParams();
  const exercise = useSuspenseQuery(exerciseQueries.get(params.exerciseId));

  const queries = {
    tiles: tileQueries.all(),
    exercise: exerciseQueries.get(exercise.data.id),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"DashboardTile", "delete">) => {
      return callApi((api) => api.DashboardTile.delete(props));
    },
    onMutate: async (variables, ctx) => {
      await Promise.all([
        ctx.client.cancelQueries(queries.tiles),
        ctx.client.cancelQueries(queries.exercise),
      ]);

      const oldTiles = ctx.client.getQueryData(queries.tiles.queryKey);
      const oldExercise = ctx.client.getQueryData(queries.exercise.queryKey);

      ctx.client.setQueryData(queries.tiles.queryKey, (tiles) => {
        if (!tiles) return tiles;
        return {
          ...tiles,
          pages: tiles.pages.map((page) => ({
            ...page,
            dashboardTiles: page.dashboardTiles.filter(
              (tile) => tile.id !== variables.path.tileId,
            ),
          })),
        };
      });

      ctx.client.setQueryData(queries.exercise.queryKey, undefined);

      return { oldTiles, oldExercise };
    },
    onError: (_e, _variables, res, ctx) => {
      ctx.client.setQueryData(queries.tiles.queryKey, res?.oldTiles);
      ctx.client.setQueryData(queries.exercise.queryKey, res?.oldExercise);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};
