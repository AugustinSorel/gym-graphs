import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/features/ui/button";
import {
  Form,
  FormAlert,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/features/ui/form";
import { Input } from "~/features/ui/input";
import { Spinner } from "~/features/ui/spinner";
import { userSchema } from "~/features/user/user.schemas";
import { signInAction } from "~/features/auth/auth.actions";

export const EmailSignInForm = () => {
  const navigate = useNavigate({ from: "/sign-in" });
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const form = useEmailSignInForm();
  const signIn = useSignIn();

  const onSubmit = async (values: SignInSchema) => {
    await signIn.mutateAsync(
      { data: values },
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
        className="grid gap-3 w-full"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
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
          <span>sign in</span>
          {(form.formState.isSubmitting || isRedirectPending) && <Spinner />}
        </Button>
      </form>
    </Form>
  );
};

const signInSchema = userSchema.pick({ email: true, password: true });
type SignInSchema = z.infer<typeof signInSchema>;

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
  return useMutation({
    mutationFn: signInAction,
  });
};
