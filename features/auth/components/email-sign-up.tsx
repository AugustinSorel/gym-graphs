import { Input } from "~/components/ui/input";
import { userSchema } from "~/features/user/user.schemas";
import { createServerFn } from "@tanstack/start";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "~/components/ui/spinner";
import { useTransition } from "react";
import { db } from "~/db/db";
import pg from "pg";
import { createUser } from "~/features/user/user.services";
import {
  generateSessionToken,
  hashSecret,
} from "~/features/auth/auth.services";
import { createSession } from "~/features/session/session.services";
import { setSessionTokenCookie } from "~/features/cookie/cookie.services";
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
} from "~/components/ui/form";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export const EmailSignUp = () => {
  const navigate = useNavigate({ from: "/sign-up" });
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const form = useForm<SignUpFormSchema>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signUp = useMutation({
    mutationFn: signUpAction,
    onSuccess: () => {
      startRedirectTransition(async () => {
        await navigate({ to: "/" });
      });
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const onSubmit = async (values: SignUpFormSchema) => {
    await signUp.mutateAsync({ data: values });
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
              <FormLabel>Email:</FormLabel>
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

const signUpAction = createServerFn({ method: "POST" })
  .validator(signUpFormSchema)
  .handler(async ({ data }) => {
    try {
      await db.transaction(async (tx) => {
        const user = await createUser(
          {
            email: data.email,
            password: await hashSecret(data.password),
          },
          tx,
        );

        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, user.id, tx);

        setSessionTokenCookie(sessionToken, session.expiresAt);
      });
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateEmail = dbError && e.constraint === "user_email_unique";

      if (duplicateEmail) {
        throw new Error("email is already used");
      }

      throw new Error(e);
    }
  });
