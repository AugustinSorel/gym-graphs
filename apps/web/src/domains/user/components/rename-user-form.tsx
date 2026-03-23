import { Button } from "~/ui/button";
import { Input } from "~/ui/input";
import { Spinner } from "~/ui/spinner";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { Controller, useForm } from "react-hook-form";
import { useUser } from "~/domains/user/hooks/use-user";
import { useMutation } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { callApi, InferApiProps } from "~/libs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import { PatchUserByIdPayload } from "@gym-graphs/shared/user/schemas";
import { Schema } from "effect";

type Props = Readonly<{
  onSuccess?: () => void;
}>;

export const RenameUserForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const renameUser = useRenameUser();

  const onSubmit = async (payload: RenameUserSchema) => {
    await renameUser.mutateAsync(
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
                placeholder="John..."
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
            data-umami-event="user renamed"
          >
            <span>rename</span>
            {form.formState.isSubmitting && <Spinner />}
          </Button>
        </footer>
      </FieldGroup>
    </form>
  );
};

const renameUserSchema = PatchUserByIdPayload.pipe(Schema.pick("name"));
type RenameUserSchema = typeof renameUserSchema.Type;

const useCreateExerciseForm = () => {
  const user = useUser();

  return useForm<RenameUserSchema>({
    resolver: effectTsResolver(renameUserSchema),
    defaultValues: {
      name: user.data.name,
    },
  });
};

const useRenameUser = () => {
  const queries = {
    user: userQueries.get,
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"User", "patch">) => {
      return callApi((api) => api.User.patch(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(userQueries.get);

      const oldUser = ctx.client.getQueryData(queries.user.queryKey);

      ctx.client.setQueryData(queries.user.queryKey, (user) => {
        if (!user || !variables.payload.name) {
          return user;
        }

        return {
          ...user,
          name: variables.payload.name,
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
