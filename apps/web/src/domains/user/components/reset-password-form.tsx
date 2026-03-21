import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Button } from "~/ui/button";
import { Input } from "~/ui/input";
import { Spinner } from "~/ui/spinner";
import { ResetPasswordPayload } from "@gym-graphs/shared/auth/schemas";
import { useTransition } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { callApi } from "~/libs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";

export const ResetPasswordForm = () => {
  const form = useResetPasswordForm();
  const resetPassword = useResetPassword();
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const navigate = routeApi.useNavigate();

  const onSubmit = async (data: typeof ResetPasswordPayload.Type) => {
    await resetPassword.mutateAsync(data, {
      onSuccess: () => {
        startRedirectTransition(async () => {
          await navigate({ to: "/dashboard" });
        });
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid w-full gap-3">
      <FieldGroup>
        <Controller
          control={form.control}
          name="password"
          render={(props) => (
            <Field data-invalid={props.fieldState.invalid}>
              <FieldLabel htmlFor={props.field.name}>Password:</FieldLabel>
              <Input
                id={props.field.name}
                {...props.field}
                autoFocus
                placeholder="******"
                type="password"
                aria-invalid={props.fieldState.invalid}
              />
              {props.fieldState.invalid && (
                <FieldError errors={[props.fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="confirmPassword"
          render={(props) => (
            <Field data-invalid={props.fieldState.invalid}>
              <FieldLabel htmlFor={props.field.name}>
                Confirm Password:
              </FieldLabel>
              <Input
                id={props.field.name}
                {...props.field}
                placeholder="******"
                type="password"
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
          disabled={form.formState.isSubmitting || isRedirectPending}
          className="font-semibold"
        >
          <span>reset password</span>
          {(form.formState.isSubmitting || isRedirectPending) && <Spinner />}
        </Button>
      </FieldGroup>
    </form>
  );
};

const routeApi = getRouteApi("/(auth)/_layout/reset-password_/$token");

const useResetPasswordForm = () => {
  const params = routeApi.useParams();

  return useForm<typeof ResetPasswordPayload.Type>({
    resolver: effectTsResolver(ResetPasswordPayload),
    defaultValues: {
      password: "",
      confirmPassword: "",
      token: params.token,
    },
  });
};

const useResetPassword = () => {
  return useMutation({
    mutationFn: async (payload: typeof ResetPasswordPayload.Type) => {
      return callApi((api) => api.Auth.resetPassword({ payload }));
    },
  });
};
