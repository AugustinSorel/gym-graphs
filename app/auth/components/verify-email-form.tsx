import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { emailVerificationSchema } from "~/auth/auth.schemas";
import { Button } from "~/ui/button";
import {
  Form,
  FormAlert,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "~/ui/input-otp";
import { useTransition } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Spinner } from "~/ui/spinner";

export const VerifyEmailForm = () => {
  const navigate = routeApi.useNavigate();
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const form = useVerifyEmailForm();
  const verifyEmail = useVerifyEmail();

  const onSubmit = async (data: VerifyEmailForm) => {
    // await verifyEmail.mutateAsync(
    //   { data },
    //   {
    //     onError: (error) => {
    //       form.setError("root", { message: error.message });
    //     },
    //     onSuccess: () => {
    //       startRedirectTransition(async () => {
    //         await navigate({ to: "/dashboard" });
    //       });
    //     },
    //   },
    // );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>One time code:</FormLabel>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  containerClassName="justify-center"
                  {...field}
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormAlert />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting || isRedirectPending}
          className="w-full font-semibold"
        >
          <span>verify</span>
          {(form.formState.isSubmitting || isRedirectPending) && <Spinner />}
        </Button>
      </form>
    </Form>
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
  // return useMutation({
  //   mutationFn: verifyEmailAction,
  // });
};

const routeApi = getRouteApi("/(auth)/_layout/verify-email");

const verifyEmailFormSchema = emailVerificationSchema.pick({ code: true });

type VerifyEmailForm = z.infer<typeof verifyEmailFormSchema>;
