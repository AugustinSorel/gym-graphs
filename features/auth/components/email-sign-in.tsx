import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormAlert,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { db } from "~/db/db";
import {
  generateSessionToken,
  verifySecret,
} from "~/features/auth/auth.services";
import { setSessionTokenCookie } from "~/features/cookie/cookie.services";
import { createSession } from "~/features/session/session.services";
import { userSchema } from "~/features/user/user.schemas";
import { selectUserByEmail } from "~/features/user/user.services";

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
        await navigate({ to: "/" });
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

const signInAction = createServerFn()
  .validator(signInSchema)
  .handler(async ({ data }) => {
    const user = await selectUserByEmail(data.email, db);

    if (!user) {
      throw new Error("email or password is invalid");
    }

    const validPassword = await verifySecret(data.password, user.password);

    if (!validPassword) {
      throw new Error("email or password is invalid");
    }

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id, db);

    setSessionTokenCookie(sessionToken, session.expiresAt);
  });
