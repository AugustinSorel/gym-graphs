import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Button } from "~/ui/button";
import { Input } from "~/ui/input";
import { Spinner } from "~/ui/spinner";
import { userSchema } from "@gym-graphs/schemas/user";
import { z } from "zod";
import { useTransition } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import type { InferApiReqInput } from "@gym-graphs/api";

export const ResetPasswordForm = () => {
  const form = useResetPasswordForm();
  const resetPassword = useResetPassword();
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const navigate = routeApi.useNavigate();
  const params = routeApi.useParams();

  const onSubmit = async (data: ResetPasswordForm) => {
    await resetPassword.mutateAsync(
      {
        json: {
          password: data.password,
          confirmPassword: data.confirmPassword,
          token: params.token,
        },
      },
      {
        onSuccess: () => {
          startRedirectTransition(async () => {
            await navigate({ to: "/dashboard" });
          });
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
          name="password"
          render={(props) => (
            <Field data-invalid={props.fieldState.invalid}>
              <FieldLabel>Password:</FieldLabel>
              <Input
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
              <FieldLabel>Confirm Password:</FieldLabel>
              <Input
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

const resetPasswordFormSchema = z
  .object({
    password: userSchema.shape.password,
    confirmPassword: userSchema.shape.password,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type ResetPasswordForm = Readonly<z.infer<typeof resetPasswordFormSchema>>;

const useResetPasswordForm = () => {
  return useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
};

const useResetPassword = () => {
  const req = api()["password-resets"].reset.$post;

  return useMutation({
    mutationFn: async (input: InferApiReqInput<typeof req>) => {
      return parseJsonResponse(req(input));
    },
  });
};
