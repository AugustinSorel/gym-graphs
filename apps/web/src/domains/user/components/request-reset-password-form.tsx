import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Button } from "~/ui/button";
import { Input } from "~/ui/input";
import { Spinner } from "~/ui/spinner";
import { ForgotPassworPayload } from "@gym-graphs/shared/auth/schemas";
import { callApi, InferApiProps } from "~/libs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import type { ComponentProps } from "react";

export const RequestResetPasswordForm = () => {
  const form = useRequestResetPasswordForm();
  const requestResetPassword = useRequestResetPassword();

  const onSubmit = async (payload: typeof ForgotPassworPayload.Type) => {
    await requestResetPassword.mutateAsync(
      { payload },
      {
        onSuccess: () => {
          form.reset();
        },
        onError: (error) => {
          form.setError("root", { message: error.message });
        },
      },
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid w-full gap-3">
      <FieldGroup>
        <Controller
          control={form.control}
          name="email"
          render={(props) => (
            <Field data-invalid={props.fieldState.invalid}>
              <FieldLabel htmlFor={props.field.name}>Email</FieldLabel>
              <Input
                id={props.field.name}
                {...props.field}
                autoFocus
                placeholder="john@example.com"
                type="email"
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

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="font-semibold"
        >
          <span>reset password</span>
          {form.formState.isSubmitting && <Spinner />}
        </Button>

        {requestResetPassword.isSuccess && (
          <SuccessMsg>email was sent successfully 🎉</SuccessMsg>
        )}
      </FieldGroup>
    </form>
  );
};

const useRequestResetPasswordForm = () => {
  return useForm<typeof ForgotPassworPayload.Type>({
    resolver: effectTsResolver(ForgotPassworPayload),
    defaultValues: {
      email: "",
    },
  });
};

const useRequestResetPassword = () => {
  return useMutation({
    mutationFn: async (props: InferApiProps<"Auth", "forgotPassword">) => {
      return callApi((api) => api.Auth.forgotPassword(props));
    },
  });
};

const SuccessMsg = (props: ComponentProps<"p">) => {
  return <p className="text-muted-foreground text-center text-sm" {...props} />;
};
