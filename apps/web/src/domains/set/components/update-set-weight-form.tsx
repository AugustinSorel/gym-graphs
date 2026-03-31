import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { Button } from "~/ui/button";
import { PatchSetPayload } from "@gym-graphs/shared/set/schemas";
import { useSet } from "~/domains/set/set.context";
import { getRouteApi } from "@tanstack/react-router";
import { CounterInput } from "~/ui/counter-input";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { callApi, InferApiProps } from "~/libs/api";
import { setQueries } from "~/domains/set/set.queries";
import { tileQueries } from "~/domains/tile/tile.queries";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import { Schema } from "effect";

export const UpdateSetWeightForm = (props: Props) => {
  const form = useUpdateSetWeightForm();
  const updateWeight = useUpdateSetWeight();
  const set = useSet();
  const params = routeApi.useParams();

  const onSubmit = async (payload: typeof WeightPayload.Type) => {
    await updateWeight.mutateAsync(
      {
        path: { exerciseId: params.exerciseId, setId: set.id },
        payload,
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
          name="weightInKg"
          render={(props) => (
            <Field
              className="flex flex-col gap-1"
              data-invalid={props.fieldState.invalid}
            >
              <FieldLabel htmlFor={props.field.name}>
                weight (<WeightUnit />
                ):
              </FieldLabel>
              <CounterInput {...props} />
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
            data-umami-event="update exercise set weight"
            className="font-semibold"
          >
            <span>update</span>
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

const routeApi = getRouteApi("/(authed)/exercises/$exerciseId/");

const WeightPayload = PatchSetPayload.pick("weightInKg").pipe(
  Schema.filter((data) => {
    if (data.weightInKg === undefined) {
      return { path: ["weightInKg"], message: "weight is required" };
    }
    return undefined;
  }),
);

const useUpdateSetWeightForm = () => {
  const set = useSet();

  return useForm<
    typeof WeightPayload.Encoded,
    unknown,
    typeof WeightPayload.Type
  >({
    resolver: effectTsResolver(WeightPayload),
    defaultValues: {
      weightInKg: set.weightInKg,
    },
  });
};

const useUpdateSetWeight = () => {
  const params = routeApi.useParams();

  const queries = {
    sets: setQueries.getAll(params.exerciseId),
    tiles: tileQueries.all(),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"Set", "patch">) => {
      return callApi((api) => api.Set.patch(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.sets);
      await ctx.client.cancelQueries(queries.tiles);

      const oldSets = ctx.client.getQueryData(queries.sets.queryKey);
      const oldTiles = ctx.client.getQueryData(queries.tiles.queryKey);

      const { weightInKg } = variables.payload;

      ctx.client.setQueryData(queries.sets.queryKey, (sets) => {
        if (!sets) return sets;

        return sets.map((set) => {
          if (set.id !== variables.path.setId) return set;
          return { ...set, weightInKg: weightInKg ?? set.weightInKg };
        });
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
                sets: tile.sets.map((set) => {
                  if (set.id !== variables.path.setId) return set;
                  return { ...set, weightInKg: weightInKg ?? set.weightInKg };
                }),
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
