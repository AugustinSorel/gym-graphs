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
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { getRouteApi } from "@tanstack/react-router";
import { callApi, InferApiProps } from "~/libs/api";
import { setQueries } from "~/domains/set/set.queries";
import { tileQueries } from "~/domains/tile/tile.queries";
import { useRouteHash } from "~/hooks/use-route-hash";

export const DeleteSetDialog = () => {
  const set = useSet();
  const deleteSet = useDeleteSet();
  const routeHash = useRouteHash(`delete-set-${set.id}`);

  const onDelete = () => {
    deleteSet.mutate(
      {
        path: { exerciseId: set.exerciseId, setId: set.id },
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
            This action cannot be undone. This will permanently delete this set.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteSet.isPending}
            onClick={(e) => {
              e.preventDefault();
              onDelete();
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

const routeApi = getRouteApi("/(authed)/exercises/$exerciseId/");

const useDeleteSet = () => {
  const params = routeApi.useParams();

  const queries = {
    sets: setQueries.getAll(params.exerciseId),
    tiles: tileQueries.all(),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"Set", "delete">) => {
      return callApi((api) => api.Set.delete(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.sets);
      await ctx.client.cancelQueries(queries.tiles);

      const oldSets = ctx.client.getQueryData(queries.sets.queryKey);
      const oldTiles = ctx.client.getQueryData(queries.tiles.queryKey);

      ctx.client.setQueryData(queries.sets.queryKey, (sets) => {
        if (!sets) return sets;
        return sets.filter((set) => set.id !== variables.path.setId);
      });

      ctx.client.setQueryData(queries.tiles.queryKey, (tiles) => {
        if (!tiles) return tiles;

        return {
          ...tiles,
          pages: tiles.pages.map((page) => ({
            ...page,
            dashboardTiles: page.dashboardTiles.map((tile) => {
              if (tile.type !== "exercise") {
                return tile;
              }

              if (tile.exerciseId !== params.exerciseId) {
                return tile;
              }

              return {
                ...tile,
                sets: tile.sets.filter(
                  (set) => set.id !== variables.path.setId,
                ),
              };
            }),
          })),
        };
      });

      return { oldSets, oldTiles };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(queries.sets.queryKey, onMutateRes?.oldSets);
      ctx.client.setQueryData(queries.tiles.queryKey, onMutateRes?.oldTiles);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.sets);
      void ctx.client.invalidateQueries(queries.tiles);
    },
  });
};
