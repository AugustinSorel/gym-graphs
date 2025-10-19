import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { useTransition } from "react";
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
import { api, parseJsonResponse } from "~/libs/api";
import type { z } from "zod";
import type { InferRequestType } from "hono";

export const EmailSignInForm = () => {
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const form = useEmailSignInForm();
  const signIn = useSignIn();

  const onSubmit = async (values: SignInSchema) => {
    await signIn.mutateAsync(
      { json: values },
      {
        onSuccess: () => {
          startRedirectTransition(async () => {
            if (search.callbackUrl) {
              await navigate({ to: search.callbackUrl });
            } else {
              await navigate({ to: "/dashboard" });
            }
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
              <FormLabel>Email</FormLabel>
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
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Button
                  asChild
                  variant="link"
                  className="text-primary h-auto p-0"
                >
                  <Link to="/reset-password">reset password</Link>
                </Button>
              </div>
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

const routeApi = getRouteApi("/(auth)/_layout/sign-in");

const signInSchema = userSchema.pick({ email: true, password: true });
type SignInSchema = Readonly<z.infer<typeof signInSchema>>;

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
  const req = api().sessions.$post;

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
  });
};
