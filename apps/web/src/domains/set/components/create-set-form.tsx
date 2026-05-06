import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { Button } from "~/ui/button";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { getRouteApi } from "@tanstack/react-router";
import { CounterInput } from "~/ui/counter-input";
import { useLastSet } from "~/domains/set/hooks/use-last-set";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { callApi, InferApiProps } from "~/libs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import { setQueries } from "../set.queries";
import { convertWeight, convertWeightToMg } from "~/domains/user/user.utils";
import { userQueries } from "~/domains/user/user.queries";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { Schema } from "effect";

export const CreateSetForm = (props: Props) => {
  const form = useCreateExerciseSetForm();
  const createSet = useCreateSet();
  const params = routeApi.useParams();
  const exercise = useSuspenseQuery(exerciseQueries.get(params.exerciseId));

  const onSubmit = async (values: Form) => {
    await createSet.mutateAsync(
      {
        path: { exerciseId: exercise.data.id },
        payload: {
          weightInMg: values.weightDisplay,
          repetitions: values.repetitions,
          doneAt: new Date(),
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
          name="weightDisplay"
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

        <footer className="bg-muted/50 -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t p-4 sm:flex-row sm:justify-end">
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

const makeFormSchema = (weightUnit: "kg" | "lbs") => {
  return Schema.Struct({
    repetitions: Schema.NonNegativeInt,
    weightDisplay: Schema.transform(Schema.Number, Schema.Int, {
      strict: true,
      decode: (w) => Math.round(convertWeightToMg(w, weightUnit)),
      encode: (w) => Math.round(convertWeight(w, weightUnit) * 1000) / 1000,
    }),
  });
};

type Form = ReturnType<typeof makeFormSchema>["Type"];

const useCreateExerciseSetForm = () => {
  const params = routeApi.useParams();
  const sets = useSuspenseQuery(setQueries.getAll(params.exerciseId));
  const lastSet = useLastSet(sets.data);
  const user = useSuspenseQuery(userQueries.get);
  const defaultWeight = convertWeightToMg(1_000_000, user.data.weightUnit);

  const schema = makeFormSchema(user.data.weightUnit);

  return useForm({
    resolver: effectTsResolver(schema),
    defaultValues: Schema.encodeSync(schema)({
      repetitions: lastSet?.repetitions ?? 1,
      weightDisplay: lastSet?.weightInMg ?? defaultWeight,
    }),
  });
};

const useCreateSet = () => {
  const params = routeApi.useParams();

  const queries = {
    exercises: exerciseQueries.all(),
    sets: setQueries.getAll(params.exerciseId),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"Set", "create">) => {
      return callApi((api) => api.Set.create(props));
    },
    onMutate: async (variables, ctx) => {
      await Promise.all([
        ctx.client.cancelQueries(queries.exercises),
        ctx.client.cancelQueries(queries.sets),
      ]);

      const oldExercises = ctx.client.getQueryData(queries.exercises.queryKey);
      const oldSets = ctx.client.getQueryData(queries.sets.queryKey);

      const optimisticSet = {
        id: Math.random(),
        exerciseId: params.exerciseId,
        weightInMg: variables.payload.weightInMg,
        repetitions: variables.payload.repetitions,
        doneAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ctx.client.setQueryData(queries.exercises.queryKey, (exercises) => {
        if (!exercises) {
          return exercises;
        }

        return {
          ...exercises,
          pages: exercises.pages.map((page) => ({
            ...page,
            exercises: page.exercises.map((exericse) => {
              if (exericse.id !== params.exerciseId) {
                return exericse;
              }

              return {
                ...exericse,
                sets: [optimisticSet, ...exericse.sets],
              };
            }),
          })),
        };
      });

      ctx.client.setQueryData(queries.sets.queryKey, (sets) => {
        if (!sets) {
          return sets;
        }

        return [optimisticSet, ...sets];
      });

      return { oldExercises, oldSets };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(
        queries.exercises.queryKey,
        onMutateRes?.oldExercises,
      );
      ctx.client.setQueryData(queries.sets.queryKey, onMutateRes?.oldSets);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.exercises);
      void ctx.client.invalidateQueries(queries.sets);
    },
  });
};
