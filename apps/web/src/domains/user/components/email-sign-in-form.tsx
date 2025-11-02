import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "~/ui/button";
import { Input } from "~/ui/input";
import { Spinner } from "~/ui/spinner";
import { userSchema } from "@gym-graphs/schemas/user";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import type { z } from "zod";
import type { InferApiReqInput } from "@gym-graphs/api";

export const EmailSignInForm = () => {
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const form = useEmailSignInForm();
  const signIn = useSignIn();

  const onSubmit = async (values: SignInSchema) => {
    await signIn.mutateAsync(
      { json: values },
      {
        onSuccess: () => {
          startRedirectTransition(async () => {
            if (search.callbackUrl) {
              await navigate({ to: search.callbackUrl });
            } else {
              await navigate({ to: "/dashboard" });
            }
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
              <FieldLabel htmlFor={props.field.name}>Email</FieldLabel>
              <Input
                {...props.field}
                placeholder="john@example.com"
                type="email"
                autoFocus
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
          name="password"
          render={(props) => (
            <Field data-invalid={props.fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={props.field.name}>Password</FieldLabel>
                <Button
                  asChild
                  variant="link"
                  className="text-primary h-auto p-0"
                >
                  <Link to="/reset-password">reset password</Link>
                </Button>
              </div>
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
          <span>sign in</span>
          {(form.formState.isSubmitting || isRedirectPending) && <Spinner />}
        </Button>
      </FieldGroup>
    </form>
  );
};

const routeApi = getRouteApi("/(auth)/_layout/sign-in");

const signInSchema = userSchema.pick({ email: true, password: true });
type SignInSchema = Readonly<z.infer<typeof signInSchema>>;

const useEmailSignInForm = () => {
  return useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
};

const useSignIn = () => {
  const req = api().sessions.$post;

  return useMutation({
    mutationFn: async (input: InferApiReqInput<typeof req>) => {
      return parseJsonResponse(req(input));
    },
  });
};
