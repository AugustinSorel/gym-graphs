import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { emailVerificationCodeSchema } from "@gym-graphs/schemas/email-verification";
import { Button } from "~/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "~/ui/input-otp";
import { useTransition } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Spinner } from "~/ui/spinner";
import { api, parseJsonResponse } from "~/libs/api";
import { Field, FieldError, FieldGroup } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import type { InferRequestType } from "hono";
import type { z } from "zod";

export const VerifyEmailForm = () => {
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const form = useVerifyEmailForm();
  const verifyEmail = useVerifyEmail();

  const onSubmit = async (data: VerifyEmailForm) => {
    await verifyEmail.mutateAsync(
      { json: data },
      {
        onError: (error) => {
          form.setError("root", { message: error.message });
        },
        onSuccess: () => {
          startRedirectTransition(async () => {
            if (search.callbackUrl) {
              await navigate({ to: search.callbackUrl });
            } else {
              await navigate({ to: "/dashboard" });
            }
          });
        },
      },
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <FieldGroup>
        <Controller
          control={form.control}
          name="code"
          render={(props) => (
            <Field
              className="flex flex-col gap-2"
              data-invalid={props.fieldState.invalid}
            >
              <InputOTP
                {...props.field}
                maxLength={6}
                containerClassName="justify-center"
                aria-invalid={props.fieldState.invalid}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {props.fieldState.invalid && (
                <FieldError errors={[props.fieldState.error]} />
              )}{" "}
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
          className="w-full font-semibold"
        >
          <span>verify</span>
          {(form.formState.isSubmitting || isRedirectPending) && <Spinner />}
        </Button>
      </FieldGroup>
    </form>
  );
};

const useVerifyEmailForm = () => {
  const form = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailFormSchema),
    defaultValues: {
      code: "",
    },
  });

  return form;
};

const useVerifyEmail = () => {
  const req = api()["email-verifications"].verify.$post;

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
  });
};

const routeApi = getRouteApi("/(auth)/_layout/verify-email");

const verifyEmailFormSchema = emailVerificationCodeSchema.pick({ code: true });

type VerifyEmailForm = Readonly<z.infer<typeof verifyEmailFormSchema>>;
