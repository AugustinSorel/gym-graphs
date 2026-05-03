import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { callApi, InferApiProps } from "~/libs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon, CheckIcon, ChevronsUpDownIcon } from "~/ui/icons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { ComponentProps } from "react";
import { Badge } from "~/ui/badge";
import { tagQueries } from "~/domains/tag/tag.queries";
import { CreateExercisePayload } from "@gym-graphs/shared/exercise/schemas";
import { Schema } from "effect";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { exerciseQueries } from "../exercise.queries";

export const CreateExerciseForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const createExercise = useCreateExercise();

  const onSubmit = async (payload: typeof CreateExercisePayload.Type) => {
    await createExercise.mutateAsync(
      { payload },
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
                placeholder="Bench press..."
                aria-invalid={props.fieldState.invalid}
                autoFocus
                {...props.field}
              />
              {props.fieldState.invalid && (
                <FieldError errors={[props.fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="tagIds"
          render={ExerciseTags}
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
            className="font-semibold"
            data-umami-event="exercise created"
          >
            <span>create</span>
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

const useFormSchema = () => {
  const queryClient = useQueryClient();

  return CreateExercisePayload.pipe(
    Schema.filter((data) => {
      const queries = {
        exercises: exerciseQueries.all().queryKey,
      };

      const cachedExercises = queryClient.getQueryData(queries.exercises);

      const nameTaken = cachedExercises?.pages
        .flatMap((page) => page.exercises)
        .find((exercise) => {
          return exercise.name === data.name;
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

const useCreateExerciseForm = () => {
  const formSchema = useFormSchema();

  return useForm<typeof CreateExercisePayload.Type>({
    resolver: effectTsResolver(formSchema),
    defaultValues: {
      name: "",
      tagIds: [],
    },
  });
};

const useCreateExercise = () => {
  const tags = useSuspenseQuery(tagQueries.all);

  const queries = {
    exercises: exerciseQueries.all(),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"Exercise", "create">) => {
      return callApi((api) => api.Exercise.create(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.exercises);

      const oldExercises = ctx.client.getQueryData(queries.exercises.queryKey);

      const optimisticExercise = {
        id: Math.random(),
        index: 1_0000,
        name: variables.payload.name,
        sets: [],
        tags: tags.data.filter((tag) => {
          return variables.payload.tagIds.includes(tag.id);
        }),
      };

      ctx.client.setQueryData(queries.exercises.queryKey, (exercises) => {
        if (!exercises) {
          return exercises;
        }

        return {
          ...exercises,
          pages: exercises.pages.map((page, i) => {
            if (i === 0) {
              return {
                ...page,
                exercises: [optimisticExercise, ...page.exercises],
              };
            }

            return page;
          }),
        };
      });

      return {
        oldExercises,
      };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(
        queries.exercises.queryKey,
        onMutateRes?.oldExercises,
      );
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.exercises);
    },
  });
};

const ExerciseTags = (
  props: Parameters<
    ComponentProps<
      typeof Controller<typeof CreateExercisePayload.Type, "tagIds">
    >["render"]
  >[0],
) => {
  const tags = useSuspenseQuery(tagQueries.all);

  if (!tags.data.length) {
    return <></>;
  }

  return (
    <Collapsible>
      <CollapsibleTrigger className="text-muted-foreground flex cursor-pointer items-center gap-1 text-sm hover:underline">
        Include tags
        <ChevronsUpDownIcon />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Field data-invalid={props.fieldState.invalid}>
          <ToggleGroup
            className="mt-3 flex flex-wrap justify-start rounded-md border p-1"
            type="multiple"
            value={props.field.value?.map((id) => id.toString()) ?? []}
            onValueChange={(ids) => {
              props.field.onChange(ids.map((id) => +id));
            }}
          >
            {tags.data.map((tag) => (
              <ToggleGroupItem
                key={tag.id}
                className="group hover:bg-transparent data-[state=on]:bg-transparent [&_svg]:size-3"
                value={tag.id.toString()}
              >
                <Badge
                  className="group-aria-pressed:border-primary/50 group-aria-pressed:bg-primary/20 group-aria-pressed:text-primary hover:group-aria-pressed:bg-primary/30"
                  variant="outline"
                >
                  <CheckIcon className="mr-1 hidden group-aria-pressed:block" />
                  {tag.name}
                </Badge>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {props.fieldState.invalid && (
            <FieldError
              errors={props.fieldState.error as unknown as Array<Error>}
            />
          )}
        </Field>
      </CollapsibleContent>
    </Collapsible>
  );
};
