import { createFileRoute, redirect } from "@tanstack/react-router";
import { CreateExerciseTileDialog } from "~/domains/tile/components/create-exercise-tile-dialog";
import { z } from "zod";
// import { FilterTilesByTags } from "~/dashboard/components/filter-tiles-by-tag";
// import { FilterTilesByName } from "~/dashboard/components/filter-tiles-by-name";
//TODO:
// import { dashboardQueries } from "~/dashboard/dashboard.queries";
// import { Dashboard } from "~/dashboard/components/dashboard";
import { tileSchema } from "@gym-graphs/schemas/tile";
import { tagSchema } from "@gym-graphs/schemas/tag";
// import { ViewToggle } from "~/dashboard/components/view-toggle";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(dashboard)/dashboard")({
  validateSearch: z.object({
    name: tileSchema.shape.name
      .catch((ctx) => z.string().catch("").parse(ctx.value))
      .optional(),
    tags: tagSchema.shape.name.array().optional(),
  }),
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user?.emailVerifiedAt) {
      throw redirect({ to: "/sign-in" });
    }
  },
  loaderDeps: ({ search }) => ({
    name: search.name,
    tags: search.tags,
  }),
  // loader: async ({ context, deps }) => {
  // const queries = {
  // tiles: dashboardQueries.tiles(deps.name, deps.tags),
  // tilesToSetsCount: dashboardQueries.tilesToSetsCount,
  // setsHeatMap: dashboardQueries.tilesSetsHeatMap,
  // funFacts: dashboardQueries.funFacts,
  // tilesToTagsCount: dashboardQueries.tilesToTagsCount,
  // };

  // void context.queryClient.prefetchQuery(queries.tilesToSetsCount);
  // void context.queryClient.prefetchQuery(queries.setsHeatMap);
  // void context.queryClient.prefetchQuery(queries.funFacts);
  // void context.queryClient.prefetchQuery(queries.tilesToTagsCount);

  // await context.queryClient.ensureInfiniteQueryData(queries.tiles);
  // },
});

const RouteComponent = () => {
  return (
    <Main>
      <Header>
        {/*
        <FilterTilesByName />
        <FilterTilesByTags />
        <ViewToggle />
        */}
        <CreateExerciseTileDialog />
      </Header>

      {/*
      <Dashboard />
    */}
    </Main>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="max-w-app mx-auto flex flex-col gap-10 overflow-hidden px-2 pt-10 pb-20 sm:px-4 lg:gap-20 lg:pt-20"
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return (
    <header className="grid grid-cols-[1fr_auto_auto_auto] gap-2" {...props} />
  );
};
