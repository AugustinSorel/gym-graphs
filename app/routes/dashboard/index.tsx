import { createFileRoute } from "@tanstack/react-router";
import { CreateExerciseTileDialog } from "~/dashboard/components/create-exercise-tile-dialog";
import { z } from "zod";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { FilterTilesByTags } from "~/dashboard/components/filter-tiles-by-tag";
import { FilterTilesByName } from "~/dashboard/components/filter-tiles-by-name";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { permissions } from "~/libs/permissions";
import { Dashboard } from "~/dashboard/components/dashboard";
import { tileSchema } from "~/dashboard/dashboard.schemas";
import { tagSchema } from "~/tag/tag.schemas";
import type { ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  validateSearch: z.object({
    name: tileSchema.shape.name.catch((e) => e.input).optional(),
    tags: tagSchema.shape.name.array().optional(),
  }),
  component: () => RouteComponent(),
  errorComponent: (props) => RouteFallback(props),
  beforeLoad: async ({ context }) => {
    const user = permissions.dashboard.view(context.user);

    return {
      user,
    };
  },
  loader: async ({ context }) => {
    const queries = {
      tiles: dashboardQueries.tiles,
      tilesToSetsCount: dashboardQueries.tilesToSetsCount,
      setsHeatMap: dashboardQueries.tilesSetsHeatMap,
      funFacts: dashboardQueries.funFacts,
      tilesToTagsCount: dashboardQueries.tilesToTagsCount,
    } as const;

    void context.queryClient.prefetchQuery(queries.tilesToSetsCount);
    void context.queryClient.prefetchQuery(queries.setsHeatMap);
    void context.queryClient.prefetchQuery(queries.funFacts);
    void context.queryClient.prefetchQuery(queries.tilesToTagsCount);

    await context.queryClient.ensureInfiniteQueryData(queries.tiles);
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
        <CreateExerciseTileDialog />
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
