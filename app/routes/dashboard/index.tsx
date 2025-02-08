import { createFileRoute } from "@tanstack/react-router";
import { CreateExerciseDialog } from "~/exercise/components/create-exercise-dialog";
import { z } from "zod";
import { SearchExercises } from "~/exercise/components/search-exercises";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { FilterExercisesByTag } from "~/exercise/components/filter-exercises-by-tag";
import { dashboardKeys } from "~/dashboard/dashboard.keys";
import { validateAccess } from "~/libs/permissions";
import { Dashboard } from "~/dashboard/components/dashboard";
import { exerciseKeys } from "~/exercise/exercise.keys";
import type { ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { setKeys } from "~/set/set.keys";

export const Route = createFileRoute("/dashboard/")({
  validateSearch: z.object({
    name: z.string().optional(),
    tags: z.string().array().optional(),
  }),
  component: () => RouteComponent(),
  errorComponent: (props) => RouteFallback(props),
  beforeLoad: async ({ context }) => {
    const user = validateAccess("dashboard", "view", context.session?.user);

    return {
      user,
    };
  },
  loader: async ({ context }) => {
    const keys = {
      tiles: dashboardKeys.tiles(context.user.id),
      exercisesFrequency: exerciseKeys.exercisesFrequency(context.user.id),
      setsHeatMap: setKeys.heatMap(context.user.id),
      funFacts: dashboardKeys.funFacts(context.user.id),
    } as const;

    void context.queryClient.prefetchQuery(keys.exercisesFrequency);
    void context.queryClient.prefetchQuery(keys.setsHeatMap);
    void context.queryClient.prefetchQuery(keys.funFacts);

    await context.queryClient.ensureInfiniteQueryData(keys.tiles);
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

      <Dashboard />
    </Main>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="max-w-app mx-auto flex flex-col gap-10 px-2 pt-10 pb-20 sm:px-4 lg:gap-20 lg:pt-20"
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid grid-cols-[1fr_auto_auto] gap-2" {...props} />;
};
