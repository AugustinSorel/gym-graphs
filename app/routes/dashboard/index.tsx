import { createFileRoute, redirect } from "@tanstack/react-router";
import { ExercisesGrid } from "~/exercise/components/exercises-grid";
import { CreateExerciseDialog } from "~/exercise/components/create-exercise-dialog";
import { z } from "zod";
import { SearchExercises } from "~/exercise/components/search-exercises";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { FilterExercisesByTag } from "~/exercise/components/filter-exercises-by-tag";
import { userKeys } from "~/user/user.keys";
import type { ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  validateSearch: z.object({
    name: z.string().optional(),
    tags: z.string().array().optional(),
  }),
  component: () => RouteComponent(),
  errorComponent: (props) => RouteFallback(props),
  beforeLoad: async ({ context }) => {
    if (!context.user?.emailVerifiedAt) {
      throw redirect({ to: "/sign-in" });
    }

    return {
      user: context.user,
    };
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      userKeys.getDashboardTiles(context.user.id),
    );
  },
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
        <FilterExercisesByTag />
        <CreateExerciseDialog />
      </Header>

      <ExercisesGrid />
    </Main>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="mx-auto flex max-w-app flex-col gap-10 px-2 pb-20 pt-10 sm:px-4 lg:gap-20 lg:pt-20"
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid grid-cols-[1fr_auto_auto] gap-2" {...props} />;
};
