import { createFileRoute, redirect } from "@tanstack/react-router";
import { CreateExerciseOverviewTileDialog } from "~/domains/tile/components/create-exercise-overview-tile-dialog";
import { z } from "zod";
import { FilterTilesByTags } from "~/domains/tile/components/filter-tiles-by-tag";
import { FilterTilesByName } from "~/domains/tile/components/filter-tiles-by-name";
import { Dashboard } from "~/domains/dashboard/components/dashboard";
import { tileSchema } from "@gym-graphs/schemas/tile";
import { tagSchema } from "@gym-graphs/schemas/tag";
import { ViewToggle } from "~/domains/dashboard/components/view-toggle";
import { tileQueries } from "~/domains/tile/tile.queries";
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
  loader: async ({ context, deps }) => {
    const queries = {
      tiles: tileQueries.all(deps.name, deps.tags),
    };

    await context.queryClient.ensureInfiniteQueryData(queries.tiles);
  },
});

const RouteComponent = () => {
  return (
    <Main>
      <Header>
        <FilterTilesByName />
        <FilterTilesByTags />
        <ViewToggle />
        <CreateExerciseOverviewTileDialog />
      </Header>

      <Dashboard />
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
