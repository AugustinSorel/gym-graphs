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
import { userSchema } from "@gym-graphs/schemas/user";
import { z } from "zod";
import { useTransition } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { InferRequestType } from "hono";
import { api, parseJsonResponse } from "~/libs/api";

export const ResetPasswordForm = () => {
  const form = useResetPasswordForm();
  const resetPassword = useResetPassword();
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const navigate = routeApi.useNavigate();
  const params = routeApi.useParams();

  const onSubmit = async (data: ResetPasswordForm) => {
    await resetPassword.mutateAsync(
      {
        password: data.password,
        confirmPassword: data.confirmPassword,
        token: params.token,
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid w-full gap-3"
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password:</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  placeholder="******"
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password:</FormLabel>
              <FormControl>
                <Input placeholder="******" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormAlert />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting || isRedirectPending}
          className="font-semibold"
        >
          <span>reset password</span>
          {(form.formState.isSubmitting || isRedirectPending) && <Spinner />}
        </Button>
      </form>
    </Form>
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
  return useMutation({
    mutationFn: async (
      json: InferRequestType<
        (typeof api)["password-resets"]["reset"]["$post"]
      >["json"],
    ) => {
      const req = api["password-resets"].reset.$post({
        json,
      });

      return parseJsonResponse(req);
    },
  });
};
