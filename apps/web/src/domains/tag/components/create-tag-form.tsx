import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { useUser } from "~/domains/user/hooks/use-user";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { tagSchema } from "@gym-graphs/schemas/tag";
import { userQueries } from "~/domains/user/user.queries";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import type { InferApiReqInput } from "@gym-graphs/api";
import type { z } from "zod";

export const CreateTagForm = (props: Props) => {
  const form = useCreateTagForm();
  const createTag = useCreateTag();

  const onSubmit = async (data: CreateTagSchema) => {
    await createTag.mutateAsync(
      { json: data },
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
  const user = useUser();

  return tagSchema.pick({ name: true }).refine(
    (data) => {
      const nameTaken = user.data.tags.find((tag) => tag.name === data.name);

      return !nameTaken;
    },
    {
      message: "tag name already created",
      path: ["name"],
    },
  );
};

type CreateTagSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateTagForm = () => {
  const formSchema = useFormSchema();

  return useForm<CreateTagSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });
};

const useCreateTag = () => {
  const user = useUser();
  const req = api().tags.$post;

  const queries = {
    user: userQueries.get,
  };

  return useMutation({
    mutationFn: async (input: InferApiReqInput<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(userQueries.get);

      const oldUser = ctx.client.getQueryData(queries.user.queryKey);

      const optimisticTag = {
        id: Math.random(),
        userId: user.data.id,
        name: variables.json.name,
        createdAt: new Date().toString(),
        updatedAt: new Date().toString(),
        exercises: [],
      };

      ctx.client.setQueryData(queries.user.queryKey, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          tags: [...user.tags, optimisticTag],
        };
      });

      return {
        oldUser,
      };
    },
    onError: (_e, _variables, onMutateResult, ctx) => {
      ctx.client.setQueryData(queries.user.queryKey, onMutateResult?.oldUser);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.user);
    },
  });
};
