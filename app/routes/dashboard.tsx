import { createFileRoute, redirect } from "@tanstack/react-router";
import { Input } from "~/features/ui/input";
import { exerciseKeys } from "~/features/exercise/exercise.keys";
import { UserProvider } from "~/features/context/user.context";
import { ExercisesGrid } from "~/features/exercise/components/exercises-grid";
import { CreateExerciseDialog } from "~/features/exercise/components/create-exercise-dialog";
import { ComponentProps } from "react";

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

const SearchExercises = () => {
  return (
    <search>
      <Input
        type="search"
        placeholder="Search exercises..."
        className="bg-secondary"
      />
    </search>
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
