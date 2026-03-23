import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { useTag } from "~/domains/tag/tag.context";
import { callApi, InferApiProps } from "~/libs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import { PatchTagPayload } from "@gym-graphs/shared/tag/schemas";
import { Schema } from "effect";
import { tagQueries } from "../tag.queries";

export const RenameTagForm = (props: Props) => {
  const form = useRenameTagForm();
  const renameTag = useRenameTag();
  const tag = useTag();

  const onSubmit = async (data: RenameTagSchema) => {
    await renameTag.mutateAsync(
      {
        path: {
          tagId: tag.id,
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

const useFormSchema = () => {
  const tags = useSuspenseQuery(tagQueries.all);

  return PatchTagPayload.pick("name").pipe(
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

type RenameTagSchema = ReturnType<typeof useFormSchema>["Type"];

const useRenameTagForm = () => {
  const formSchema = useFormSchema();
  const tag = useTag();

  return useForm<RenameTagSchema>({
    resolver: effectTsResolver(formSchema),
    defaultValues: {
      name: tag.name,
    },
  });
};

const useRenameTag = () => {
  const queries = {
    tags: tagQueries.all,
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"Tag", "patch">) => {
      return callApi((api) => api.Tag.patch(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.tags);

      const oldTags = ctx.client.getQueryData(queries.tags.queryKey);

      ctx.client.setQueryData(queries.tags.queryKey, (tags) => {
        if (!tags) {
          return tags;
        }

        return tags.map((tag) => {
          if (tag.id === variables.path.tagId && variables.payload.name) {
            return {
              ...tag,
              name: variables.payload.name,
            };
          }

          return tag;
        });
      });

      return { oldTags };
    },
    onError: (_e, _variables, onMutateResult, ctx) => {
      ctx.client.setQueryData(queries.tags.queryKey, onMutateResult?.oldTags);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tags);
    },
  });
};
