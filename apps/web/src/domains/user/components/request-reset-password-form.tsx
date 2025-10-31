import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Button } from "~/ui/button";
import { Input } from "~/ui/input";
import { Spinner } from "~/ui/spinner";
import { userSchema } from "@gym-graphs/schemas/user";
import { api, parseJsonResponse } from "~/libs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import type { InferRequestType } from "hono";
import type { z } from "zod";
import type { ComponentProps } from "react";

export const RequestResetPasswordForm = () => {
  const form = useRequestResetPasswordForm();
  const requestResetPassword = useRequestResetPassword();

  const onSubmit = async (data: RequestResetPassword) => {
    await requestResetPassword.mutateAsync(
      { json: data },
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
              <FieldLabel>Email</FieldLabel>
              <Input
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

const requestResetPasswordSchema = userSchema.pick({ email: true });
type RequestResetPassword = Readonly<
  z.infer<typeof requestResetPasswordSchema>
>;

const useRequestResetPasswordForm = () => {
  return useForm<RequestResetPassword>({
    resolver: zodResolver(requestResetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
};

const useRequestResetPassword = () => {
  const req = api()["password-resets"].$post;

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
  });
};

const SuccessMsg = (props: ComponentProps<"p">) => {
  return <p className="text-muted-foreground text-center text-sm" {...props} />;
};
