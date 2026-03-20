import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { VerificationCodeSchema } from "@gym-graphs/shared/verification-code/schemas";
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
import { callApi } from "~/libs/api";
import { Field, FieldError, FieldGroup } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";

export const VerifyEmailForm = () => {
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const form = useVerifyEmailForm();
  const verifyEmail = useVerifyEmail();

  const onSubmit = async (data: typeof VerificationCodeSchema.Type) => {
    await verifyEmail.mutateAsync(data, {
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
    });
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
  const form = useForm<typeof VerificationCodeSchema.Type>({
    resolver: effectTsResolver(VerificationCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  return form;
};

const useVerifyEmail = () => {
  return useMutation({
    mutationFn: async (payload: typeof VerificationCodeSchema.Type) => {
      return callApi((api) => api.Auth.verifyAccount({ payload }));
    },
  });
};

const routeApi = getRouteApi("/(auth)/_layout/verify-email");
