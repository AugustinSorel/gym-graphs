import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { getRouteApi } from "@tanstack/react-router";
import { callApi, InferApiProps } from "~/libs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import { Schema } from "effect";
import { PatchExercisePayload } from "@gym-graphs/shared/exercise/schemas";

export const RenameExerciseForm = (props: Props) => {
  const form = useRenameExerciseForm();
  const renameExercise = useRenameExericse();
  const params = routeApi.useParams();
  const exercise = useSuspenseQuery(exerciseQueries.get(params.exerciseId));

  const onSubmit = async (data: RenameExerciseSchema) => {
    await renameExercise.mutateAsync(
      {
        path: {
          exerciseId: exercise.data.id,
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

        <footer className="bg-muted/50 -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t p-4 sm:flex-row sm:justify-end">
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

  return PatchExercisePayload.pipe(
    Schema.filter((data) => {
      const cachedExercises = queryClient.getQueryData(
        exerciseQueries.all().queryKey,
      );

      const nameTaken = cachedExercises?.pages
        .flatMap((page) => page.exercises)
        .find((exercise) => {
          return (
            exercise.name === data.name && exercise.id !== params.exerciseId
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

const useRenameExerciseForm = () => {
  const formSchema = useFormSchema();
  const params = routeApi.useParams();
  const exercise = useSuspenseQuery(exerciseQueries.get(params.exerciseId));

  return useForm<RenameExerciseSchema>({
    resolver: effectTsResolver(formSchema),
    defaultValues: {
      name: exercise.data.name,
    },
  });
};

const useRenameExericse = () => {
  const params = routeApi.useParams();
  const exercise = useSuspenseQuery(exerciseQueries.get(params.exerciseId));

  const queries = {
    exercise: exerciseQueries.get(exercise.data.id),
    exercises: exerciseQueries.all(),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"Exercise", "patch">) => {
      return callApi((api) => api.Exercise.patch(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.exercise);
      await ctx.client.cancelQueries(queries.exercises);

      const oldExercises = ctx.client.getQueryData(queries.exercises.queryKey);
      const oldExercise = ctx.client.getQueryData(queries.exercise.queryKey);

      const name = variables.payload.name;

      ctx.client.setQueryData(queries.exercises.queryKey, (exercises) => {
        if (!exercises || !name) {
          return exercises;
        }

        return {
          ...exercises,
          pages: exercises.pages.map((page) => {
            return {
              ...page,
              exercises: page.exercises.map((exercise) => {
                if (exercise.id === variables.path.exerciseId) {
                  return {
                    ...exercise,
                    name,
                  };
                }

                return exercise;
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
        oldExercises,
        oldExercise,
      };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(
        queries.exercises.queryKey,
        onMutateRes?.oldExercises,
      );
      ctx.client.setQueryData(
        queries.exercise.queryKey,
        onMutateRes?.oldExercise,
      );
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.exercises);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};
