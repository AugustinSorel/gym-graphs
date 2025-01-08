import {
  createFileRoute,
  ErrorComponentProps,
  redirect,
} from "@tanstack/react-router";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { ExercisesGrid } from "~/exercise/components/exercises-grid";
import { CreateExerciseDialog } from "~/exercise/components/create-exercise-dialog";
import { ComponentProps } from "react";
import { z } from "zod";
import { SearchExercises } from "~/exercise/components/search-exercises";
import { DefaultErrorFallback } from "~/components/default-error-fallback";

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
  return (
    <Main>
      <Header>
        <SearchExercises />
        <CreateExerciseDialog />
      </Header>

      <ExercisesGrid />
    </Main>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="mx-auto flex max-w-app flex-col gap-10 px-4 pb-20 pt-10 lg:gap-20 lg:pt-20"
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid grid-cols-[1fr_auto] gap-2" {...props} />;
};
