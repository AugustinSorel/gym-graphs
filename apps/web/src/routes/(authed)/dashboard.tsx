import { createFileRoute } from "@tanstack/react-router";
import { CreateExerciseOverviewTileDialog } from "~/domains/tile/components/create-exercise-overview-tile-dialog";
import { FilterTilesByTags } from "~/domains/tile/components/filter-tiles-by-tag";
import { FilterTilesByName } from "~/domains/tile/components/filter-tiles-by-name";
import { Dashboard } from "~/domains/dashboard/components/dashboard";
import { ViewToggle } from "~/domains/dashboard/components/view-toggle";
import { tileQueries } from "~/domains/tile/tile.queries";
import type { ComponentProps } from "react";
import { Schema } from "effect";
import { tagQueries } from "~/domains/tag/tag.queries";

export const Route = createFileRoute("/(authed)/dashboard")({
  validateSearch: (e) => {
    return Schema.decodeUnknownSync(
      Schema.Struct({
        name: Schema.optionalWith(Schema.String, { exact: true }),
        tags: Schema.optionalWith(Schema.String.pipe(Schema.Array), {
          exact: true,
        }),
      }),
    )(e);
  },

  component: () => RouteComponent(),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const queries = {
      tiles: tileQueries.all(deps),
      tags: tagQueries.all,
    };

    await context.queryClient.ensureInfiniteQueryData(queries.tiles);
    await context.queryClient.ensureQueryData(queries.tags);
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
