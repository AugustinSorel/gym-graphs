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

export const EmailSignIn = () => {
  const navigate = useNavigate({ from: "/sign-in" });
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signIn = useMutation({
    mutationFn: signInAction,
    onSuccess: () => {
      startRedirectTransition(async () => {
        await navigate({ to: "/dashboard" });
      });
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const onSubmit = async (values: SignInSchema) => {
    await signIn.mutateAsync({ data: values });
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
