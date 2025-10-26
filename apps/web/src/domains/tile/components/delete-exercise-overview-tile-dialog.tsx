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
import { Button } from "~/ui/button";
import { Spinner } from "~/ui/spinner";
import { getRouteApi } from "@tanstack/react-router";
import { useTransition } from "react";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { api, parseJsonResponse } from "~/libs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import { useRouteHash } from "~/hooks/use-route-hash";
import type { InferRequestType } from "hono";

export const DeleteExerciseOverviewTileDialog = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = routeApi.useNavigate();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);
  const deleteExerciseTile = useDeleteExerciseTile();
  const routeHash = useRouteHash("delete-exercise-overview-tile");

  const deleteExerciseTileHandler = () => {
    deleteExerciseTile.mutate(
      {
        param: {
          tileId: exercise.data.exerciseOverviewTile.tileId.toString(),
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
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);
  const req = api().tiles[":tileId"].$delete;

  const queries = {
    tiles: tileQueries.all(),
    exercise: exerciseQueries.get(exercise.data.id),
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
              tiles: page.tiles.filter((tile) => {
                return tile.id.toString() !== variables.param.tileId;
              }),
            };
          }),
        };
      });

      ctx.client.removeQueries(queries.exercise);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.exercise);
      void ctx.client.invalidateQueries(queries.tiles);
    },
  });
};
