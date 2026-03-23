import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { CreateTagPayload } from "@gym-graphs/shared/tag/schemas";
import { userQueries } from "~/domains/user/user.queries";
import { callApi, InferApiProps } from "~/libs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import { Schema } from "effect";
import { tagQueries } from "../tag.queries";

export const CreateTagForm = (props: Props) => {
  const form = useCreateTagForm();
  const createTag = useCreateTag();

  const onSubmit = async (payload: typeof CreateTagPayload.Type) => {
    await createTag.mutateAsync(
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
                {...props.field}
                placeholder="Legs..."
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
  const tags = useSuspenseQuery(tagQueries.all);

  return CreateTagPayload.pipe(
    Schema.filter((data) => {
      const nameTaken = tags.data.find((tag) => tag.name === data.name);

      if (nameTaken) {
        return {
          path: ["name"],
          message: "tag name is already taken",
        };
      }

      return undefined;
    }),
  );
};

const useCreateTagForm = () => {
  const formSchema = useFormSchema();

  return useForm<typeof CreateTagPayload.Type>({
    resolver: effectTsResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });
};

const useCreateTag = () => {
  const queries = {
    tags: tagQueries.all,
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"Tag", "create">) => {
      return callApi((api) => api.Tag.create(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(userQueries.get);

      const oldTags = ctx.client.getQueryData(queries.tags.queryKey);

      const optimisticTag = {
        id: Math.random(),
        name: variables.payload.name,
      };

      ctx.client.setQueryData(queries.tags.queryKey, (tags) => {
        if (!tags) {
          return tags;
        }

        return [...tags, optimisticTag];
      });

      return {
        oldTags,
      };
    },
    onError: (_e, _variables, onMutateResult, ctx) => {
      ctx.client.setQueryData(queries.tags.queryKey, onMutateResult?.oldTags);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tags);
    },
  });
};
