import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { getRouteApi } from "@tanstack/react-router";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { callApi, InferApiProps } from "~/libs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import { PatchDashboardTilePayload } from "@gym-graphs/shared/dashboard-tile/schemas";
import { Schema } from "effect";

export const RenameExerciseOverviewTileForm = (props: Props) => {
  const form = useRenameExerciseTileForm();
  const renameExerciseTile = useRenameExericseTile();
  const params = routeApi.useParams();
  const exercise = useExercise(Number(params.exerciseId));

  const onSubmit = async (data: RenameExerciseSchema) => {
    await renameExerciseTile.mutateAsync(
      {
        path: {
          tileId: exercise.data.tileId,
        },
        payload: {
          name: data.name,
        },
      },
      {
        onSuccess: () => {
          if (props.onSuccess) {
            props.onSuccess();
          }
        },
        onError: (error) => {
          form.setError("root", { message: error.message });
        },
      },
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={(props) => (
            <Field data-invalid={props.fieldState.invalid}>
              <FieldLabel htmlFor={props.field.name}>Name:</FieldLabel>
              <Input
                id={props.field.name}
                {...props.field}
                placeholder="Bench press..."
                autoFocus
                aria-invalid={props.fieldState.invalid}
              />
              {props.fieldState.invalid && (
                <FieldError errors={[props.fieldState.error]} />
              )}
            </Field>
          )}
        />

        {form.formState.errors.root?.message && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <footer className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            data-umami-event="rename exercise"
            className="font-semibold"
          >
            <span>rename</span>
            {form.formState.isSubmitting && <Spinner />}
          </Button>
        </footer>
      </FieldGroup>
    </form>
  );
};

type Props = Readonly<{
  onSuccess?: () => void;
}>;

const routeApi = getRouteApi("/(authed)/exercises/$exerciseId/settings");

const useFormSchema = () => {
  const queryClient = useQueryClient();
  const params = routeApi.useParams();

  return PatchDashboardTilePayload.pipe(
    Schema.filter((data) => {
      const cachedTiles = queryClient.getQueryData(tileQueries.all().queryKey);

      const nameTaken = cachedTiles?.pages
        .flatMap((page) => page.dashboardTiles)
        .find((tile) => {
          return (
            tile.name === data.name &&
            tile.type === "exercise" &&
            tile.exerciseId !== params.exerciseId
          );
        });

      if (nameTaken) {
        return {
          message: "exercise already created",
          path: ["name"],
        };
      }

      return undefined;
    }),
  );
};

type RenameExerciseSchema = ReturnType<typeof useFormSchema>["Type"];

const useRenameExerciseTileForm = () => {
  const formSchema = useFormSchema();
  const params = routeApi.useParams();
  const exercise = useExercise(Number(params.exerciseId));

  return useForm<RenameExerciseSchema>({
    resolver: effectTsResolver(formSchema),
    defaultValues: {
      name: exercise.data.name,
    },
  });
};

const useRenameExericseTile = () => {
  const params = routeApi.useParams();
  const exercise = useExercise(Number(params.exerciseId));

  const queries = {
    exercise: exerciseQueries.get(exercise.data.id),
    tiles: tileQueries.all(),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"DashboardTile", "patch">) => {
      return callApi((api) => api.DashboardTile.patch(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.exercise);
      await ctx.client.cancelQueries(queries.tiles);

      const oldTiles = ctx.client.getQueryData(queries.tiles.queryKey);
      const oldExercise = ctx.client.getQueryData(queries.exercise.queryKey);

      const name = variables.payload.name;

      ctx.client.setQueryData(queries.tiles.queryKey, (tiles) => {
        if (!tiles || !name) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page) => {
            return {
              ...page,
              dashboardTiles: page.dashboardTiles.map((tile) => {
                if (tile.id === variables.path.tileId) {
                  return {
                    ...tile,
                    name,
                  };
                }

                return tile;
              }),
            };
          }),
        };
      });

      ctx.client.setQueryData(queries.exercise.queryKey, (exercise) => {
        if (!exercise || !name) {
          return exercise;
        }

        return {
          ...exercise,
          name,
        };
      });

      return {
        oldTiles,
        oldExercise,
      };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(queries.tiles.queryKey, onMutateRes?.oldTiles);
      ctx.client.setQueryData(
        queries.exercise.queryKey,
        onMutateRes?.oldExercise,
      );
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};
