import { createFileRoute } from "@tanstack/react-router";
import { CreateExerciseDialog } from "~/exercise/components/create-exercise-dialog";
import { z } from "zod";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { FilterTilesByTags } from "~/dashboard/components/filter-tiles-by-tag";
import { FilterTilesByName } from "~/dashboard/components/filter-tiles-by-name";
import { dashboardKeys } from "~/dashboard/dashboard.keys";
import { validateAccess } from "~/libs/permissions";
import { Dashboard } from "~/dashboard/components/dashboard";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { setKeys } from "~/set/set.keys";
import { tagKeys } from "~/tag/tag.keys";
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
    const user = validateAccess("dashboard", "view", context.session?.user);

    return {
      user,
    };
  },
  loader: async ({ context }) => {
    const keys = {
      tiles: dashboardKeys.tiles,
      exercisesFrequency: exerciseKeys.exercisesFrequency,
      setsHeatMap: setKeys.heatMap,
      funFacts: dashboardKeys.funFacts,
      tagsFrequency: tagKeys.frequency,
    } as const;

    void context.queryClient.prefetchQuery(keys.exercisesFrequency);
    void context.queryClient.prefetchQuery(keys.setsHeatMap);
    void context.queryClient.prefetchQuery(keys.funFacts);
    void context.queryClient.prefetchQuery(keys.tagsFrequency);

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
        <FilterTilesByName />
        <FilterTilesByTags />
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
