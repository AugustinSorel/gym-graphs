import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { useMutation, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { Button } from "~/ui/button";
import { CreateSetPayload } from "@gym-graphs/shared/set/schemas";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { getRouteApi } from "@tanstack/react-router";
import { CounterInput } from "~/ui/counter-input";
import { useLastSet } from "~/domains/set/hooks/use-last-set";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { callApi, InferApiProps } from "~/libs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";

export const CreateSetForm = (props: Props) => {
  const form = useCreateExerciseSetForm();
  const createSet = useCreateSet();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);

  const onSubmit = async (payload: typeof CreateSetPayload.Type) => {
    await createSet.mutateAsync(
      {
        path: { exerciseId: exercise.data.id },
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
          name="weightInKg"
          control={form.control}
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

        <Controller
          control={form.control}
          name="repetitions"
          render={(props) => (
            <Field
              className="flex flex-col gap-1"
              data-invalid={props.fieldState.invalid}
            >
              <FieldLabel htmlFor={props.field.name}>repetitions:</FieldLabel>
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
            data-umami-event="exercise set created"
            className="font-semibold"
          >
            <span>add</span>
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

const useCreateExerciseSetForm = () => {
  const params = routeApi.useParams();
  const tiles = useSuspenseInfiniteQuery(tileQueries.all());
  const sets =
    tiles.data.find((tile) => tile.exerciseId === params.exerciseId)?.sets ??
    [];

  const lastSet = useLastSet(sets);

  return useForm<
    typeof CreateSetPayload.Encoded,
    unknown,
    typeof CreateSetPayload.Type
  >({
    resolver: effectTsResolver(CreateSetPayload),
    defaultValues: {
      repetitions: lastSet?.repetitions ?? 0,
      weightInKg: lastSet?.weightInKg ?? 0,
    },
  });
};

const useCreateSet = () => {
  const params = routeApi.useParams();

  const queries = {
    tiles: tileQueries.all(),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"Set", "create">) => {
      return callApi((api) => api.Set.create(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.tiles);

      const oldTiles = ctx.client.getQueryData(queries.tiles.queryKey);

      const optimisticSet = {
        id: Math.random(),
        exerciseId: params.exerciseId,
        weightInKg: variables.payload.weightInKg,
        repetitions: variables.payload.repetitions,
        doneAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ctx.client.setQueryData(queries.tiles.queryKey, (tiles) => {
        if (!tiles) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page) => ({
            ...page,
            dashboardTiles: page.dashboardTiles.map((tile) => {
              if (tile.exerciseId !== params.exerciseId) {
                return tile;
              }

              return {
                ...tile,
                sets: [optimisticSet, ...tile.sets],
              };
            }),
          })),
        };
      });

      return { oldTiles };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(queries.tiles.queryKey, onMutateRes?.oldTiles);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tiles);
    },
  });
};
