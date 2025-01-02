import {
  createFileRoute,
  ErrorComponentProps,
  redirect,
} from "@tanstack/react-router";
import { exerciseKeys } from "~/features/exercise/exercise.keys";
import { UserProvider } from "~/features/context/user.context";
import { ExercisesGrid } from "~/features/exercise/components/exercises-grid";
import { CreateExerciseDialog } from "~/features/exercise/components/create-exercise-dialog";
import { ComponentProps } from "react";
import { z } from "zod";
import { SearchExercises } from "~/features/exercise/components/search-exercises";
import { DefaultErrorFallback } from "~/features/components/default-error-fallback";

export const Route = createFileRoute("/dashboard")({
  component: () => RouteComponent(),
  errorComponent: (props) => RouteFallback(props),
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
  validateSearch: z.object({
    name: z.string().optional(),
  }),
});

const RouteFallback = (props: ErrorComponentProps) => {
  return (
    <Main>
      <DefaultErrorFallback {...props} />
    </Main>
  );
};

const RouteComponent = () => {
  const loaderData = Route.useLoaderData();

  return (
    <UserProvider user={loaderData.user}>
      <Main>
        <Header>
          <SearchExercises />
          <CreateExerciseDialog />
        </Header>

        <ExercisesGrid />
      </Main>
    </UserProvider>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="mx-auto flex max-w-app flex-col gap-20 px-4 py-20"
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid grid-cols-[1fr_auto] gap-2" {...props} />;
};
