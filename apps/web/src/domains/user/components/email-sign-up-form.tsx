import { Input } from "~/ui/input";
import { SignUpPayload } from "@gym-graphs/shared/auth/schemas";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "~/ui/spinner";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { Button } from "~/ui/button";
import { callApi } from "~/libs/api";
import { getRouteApi } from "@tanstack/react-router";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";

export const EmailSignUpForm = () => {
  const navigate = routeApi.useNavigate();
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const form = useEmailSignUpForm();
  const signUp = useSignUp();

  const onSubmit = async (payload: typeof SignUpPayload.Type) => {
    await signUp.mutateAsync(payload, {
      onSuccess: () => {
        startRedirectTransition(async () => {
          await navigate({
            to: "/verify-email",
            search: (prev) => ({ callbackUrl: prev.callbackUrl }),
          });
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
          name="email"
          render={(props) => (
            <Field data-invalid={props.fieldState.invalid}>
              <FieldLabel htmlFor={props.field.name}>Email:</FieldLabel>
              <Input
                id={props.field.name}
                {...props.field}
                placeholder="john@example.com"
                aria-invalid={props.fieldState.invalid}
                type="email"
                autoFocus
              />
              {props.fieldState.invalid && (
                <FieldError errors={[props.fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={(props) => (
            <Field data-invalid={props.fieldState.invalid}>
              <FieldLabel htmlFor={props.field.name}>Password:</FieldLabel>
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
          <span>sign up</span>
          {(form.formState.isSubmitting || isRedirectPending) && <Spinner />}
        </Button>
      </FieldGroup>
    </form>
  );
};

const routeApi = getRouteApi("/(auth)/_layout/sign-up");

const useEmailSignUpForm = () => {
  return useForm<typeof SignUpPayload.Type>({
    resolver: effectTsResolver(SignUpPayload),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
};

const useSignUp = () => {
  return useMutation({
    mutationFn: async (payload: typeof SignUpPayload.Type) => {
      return callApi((api) => api.Auth.signUp({ payload }));
    },
  });
};
