import { Input } from "~/ui/input";
import { userSchema } from "~/user/user.schemas";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "~/ui/spinner";
import { useTransition } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormAlert,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/ui/form";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "~/ui/button";
import { signUpAction } from "~/auth/auth.actions";

export const EmailSignUpForm = () => {
  const navigate = useNavigate({ from: "/sign-up" });
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const form = useEmailSignUpForm();
  const signUp = useSignUp();

  const onSubmit = async (values: SignUpFormSchema) => {
    await signUp.mutateAsync(
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
        className="grid w-full gap-3"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email:</FormLabel>
              <FormControl>
                <Input
                  placeholder="john@example.com"
                  type="email"
                  autoFocus
                  {...field}
                />
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
              <FormLabel>Password:</FormLabel>
              <FormControl>
                <Input placeholder="******" type="password" {...field} />
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
          <span>sign up</span>
          {(form.formState.isSubmitting || isRedirectPending) && <Spinner />}
        </Button>
      </form>
    </Form>
  );
};

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
type SignUpFormSchema = z.infer<typeof signUpFormSchema>;

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
  return useMutation({
    mutationFn: signUpAction,
  });
};
