import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { Button } from "~/ui/button";
import { PatchSetPayload } from "@gym-graphs/shared/set/schemas";
import { useSet } from "~/domains/set/set.context";
import { getRouteApi } from "@tanstack/react-router";
import { Input } from "~/ui/input";
import { callApi, InferApiProps } from "~/libs/api";
import { setQueries } from "~/domains/set/set.queries";
import { dateAsYYYYMMDD } from "~/utils/date";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import { Schema } from "effect";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";

export const UpdateSetDoneAtForm = (props: Props) => {
  const form = useUpdateSetDoneAtForm();
  const updateDoneAt = useUpdateSetDoneAt();
  const set = useSet();
  const params = routeApi.useParams();

  const onSubmit = async (payload: typeof DoneAtPayload.Type) => {
    await updateDoneAt.mutateAsync(
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
          name="doneAt"
          render={(props) => (
            <Field data-invalid={props.fieldState.invalid}>
              <FieldLabel htmlFor={props.field.name}>done at:</FieldLabel>
              <Input
                id={props.field.name}
                type="date"
                autoFocus
                aria-invalid={props.fieldState.invalid}
                value={
                  props.field.value
                    ? dateAsYYYYMMDD(new Date(props.field.value))
                    : ""
                }
                onChange={(e) => props.field.onChange(e.target.value)}
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

        <footer className="bg-muted/50 -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t p-4 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            data-umami-event="update exercise set done at"
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

const DoneAtPayload = PatchSetPayload.pick("doneAt").pipe(
  Schema.filter((data) => {
    if (data.doneAt === undefined) {
      return { path: ["doneAt"], message: "date is required" };
    }
    return undefined;
  }),
);

const useUpdateSetDoneAtForm = () => {
  const set = useSet();

  return useForm<
    typeof DoneAtPayload.Encoded,
    unknown,
    typeof DoneAtPayload.Type
  >({
    resolver: effectTsResolver(DoneAtPayload),
    defaultValues: {
      doneAt: set.doneAt.toISOString(),
    },
  });
};

const useUpdateSetDoneAt = () => {
  const params = routeApi.useParams();

  const queries = {
    sets: setQueries.getAll(params.exerciseId),
    exercises: exerciseQueries.all(),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"Set", "patch">) => {
      return callApi((api) => api.Set.patch(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.sets);
      await ctx.client.cancelQueries(queries.exercises);

      const oldSets = ctx.client.getQueryData(queries.sets.queryKey);
      const oldExercises = ctx.client.getQueryData(queries.exercises.queryKey);

      const { doneAt } = variables.payload;

      ctx.client.setQueryData(queries.sets.queryKey, (sets) => {
        if (!sets) return sets;

        return sets.map((set) => {
          if (set.id !== variables.path.setId) return set;
          return { ...set, doneAt: doneAt ?? set.doneAt };
        });
      });

      ctx.client.setQueryData(queries.exercises.queryKey, (exercises) => {
        if (!exercises) return exercises;

        return {
          ...exercises,
          pages: exercises.pages.map((page) => ({
            ...page,
            exercises: page.exercises.map((exercise) => {
              if (exercise.id !== params.exerciseId) {
                return exercise;
              }

              return {
                ...exercise,
                sets: exercise.sets.map((set) => {
                  if (set.id !== variables.path.setId) {
                    return set;
                  }

                  return { ...set, doneAt: doneAt ?? set.doneAt };
                }),
              };
            }),
          })),
        };
      });

      return { oldSets, oldExercises };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(queries.sets.queryKey, onMutateRes?.oldSets);
      ctx.client.setQueryData(
        queries.exercises.queryKey,
        onMutateRes?.oldExercises,
      );
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.sets);
      void ctx.client.invalidateQueries(queries.exercises);
    },
  });
};
