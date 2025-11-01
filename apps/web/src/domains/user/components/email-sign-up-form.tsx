import { Input } from "~/ui/input";
import { userSchema } from "@gym-graphs/schemas/user";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "~/ui/spinner";
import { useTransition } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/ui/button";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";
import { getRouteApi } from "@tanstack/react-router";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import type { InferApiReqInput } from "@gym-graphs/api";

export const EmailSignUpForm = () => {
  const navigate = routeApi.useNavigate();
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const form = useEmailSignUpForm();
  const signUp = useSignUp();

  const onSubmit = async (values: SignUpFormSchema) => {
    await signUp.mutateAsync(
      { json: values },
      {
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
              <FieldLabel>Email:</FieldLabel>
              <Input
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
              <FieldLabel>Password:</FieldLabel>
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
          <span>sign up</span>
          {(form.formState.isSubmitting || isRedirectPending) && <Spinner />}
        </Button>
      </FieldGroup>
    </form>
  );
};

const routeApi = getRouteApi("/(auth)/_layout/sign-up");

const signUpFormSchema = z
  .object({
    email: userSchema.shape.email,
    password: userSchema.shape.password,
    confirmPassword: userSchema.shape.password,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type SignUpFormSchema = Readonly<z.infer<typeof signUpFormSchema>>;

const useEmailSignUpForm = () => {
  return useForm<SignUpFormSchema>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
};

const useSignUp = () => {
  const req = api().users.$post;

  return useMutation({
    mutationFn: async (input: InferApiReqInput<typeof req>) => {
      return parseJsonResponse(req(input));
    },
  });
};
