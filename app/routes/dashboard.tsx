import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
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
import { createExerciseAction } from "~/features/exercise/exercise.actions";
import { exerciseKeys } from "~/features/exercise/exercise.keys";
import { exerciseSchema } from "~/features/exercise/exericse.schemas";
import { signOutAction } from "~/features/auth/auth.actions";
import { useTransition } from "react";

export const Route = createFileRoute("/dashboard")({
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user || !context.session) {
      throw redirect({ to: "/sign-in" });
    }

    return {
      user: context.user,
    };
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      exerciseKeys.all(context.user.id),
    );

    return {
      user: context.user,
    };
  },
});

const RouteComponent = () => {
  const loaderData = Route.useLoaderData();

  const postQuery = useSuspenseQuery(exerciseKeys.all(loaderData.user.id));
  const queryClient = useQueryClient();

  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = useNavigate();

  const formSchema = exerciseSchema.pick({ name: true }).refine(
    (data) => {
      const key = exerciseKeys.all(loaderData.user.id).queryKey;
      const cachedExercises = queryClient.getQueryData(key);

      return !cachedExercises?.find((exercise) => exercise.name === data.name);
    },
    {
      message: "exercise already created",
      path: ["name"],
    },
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const createExercise = useMutation({
    mutationFn: createExerciseAction,
    onSuccess: () => {
      form.reset();
    },
    onMutate: (variables) => {
      const key = exerciseKeys.all(loaderData.user.id).queryKey;

      const optimisticExercise = {
        userId: loaderData.user.id,
        name: variables.data.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(key, (exercises) => {
        if (!exercises) {
          return [];
        }

        return [optimisticExercise, ...exercises];
      });
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries(exerciseKeys.all(loaderData.user.id));
    },
  });

  const signOut = useMutation({
    mutationFn: signOutAction,
    onSuccess: () => {
      startRedirectTransition(async () => {
        await navigate({ to: "/sign-in" });
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await createExercise.mutateAsync({ data });
  };

  return (
    <main>
      <code>{JSON.stringify(postQuery.data)}</code>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name:</FormLabel>
                <FormControl>
                  <Input placeholder="shadcn" {...field} />
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
            <span>create</span>
            {form.formState.isSubmitting && <Spinner />}
          </Button>
        </form>
      </Form>
      <Button
        disabled={signOut.isPending || isRedirectPending}
        onClick={() => {
          signOut.mutate({});
        }}
      >
        <span>sign out</span>
        {(signOut.isPending || isRedirectPending) && <Spinner />}
      </Button>
    </main>
  );
};
