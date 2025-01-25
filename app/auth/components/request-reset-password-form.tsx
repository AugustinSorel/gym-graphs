import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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
import { Input } from "~/ui/input";
import { Spinner } from "~/ui/spinner";
import { userSchema } from "~/user/user.schemas";
import { requestResetPasswordAction } from "../auth.actions";
import type { z } from "zod";
import type { ComponentProps } from "react";

export const RequestResetPasswordForm = () => {
  const form = useRequestResetPasswordForm();
  const requestResetPassword = useRequestResetPassword();

  const onSubmit = async (data: RequestResetPassword) => {
    await requestResetPassword.mutateAsync(
      { data },
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid w-full gap-3"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  placeholder="john@example.com"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormAlert />

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
      </form>
    </Form>
  );
};

const requestResetPasswordSchema = userSchema.pick({ email: true });
type RequestResetPassword = z.infer<typeof requestResetPasswordSchema>;

const useRequestResetPasswordForm = () => {
  return useForm<RequestResetPassword>({
    resolver: zodResolver(requestResetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
};

const useRequestResetPassword = () => {
  return useMutation({
    mutationFn: requestResetPasswordAction,
  });
};

const SuccessMsg = (props: ComponentProps<"p">) => {
  return <p className="text-center text-sm text-muted-foreground" {...props} />;
};
