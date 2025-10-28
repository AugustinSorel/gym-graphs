import { createFileRoute, redirect } from "@tanstack/react-router";
//TODO:
// import { FilterTeamsByName } from "~/team/components/filter-teams-by-name";
import { CreateTeamDialog } from "~/domains/team/components/create-team-dialog";
import { z } from "zod";
import { teamSchema } from "@gym-graphs/schemas/team";
import { teamQueries } from "~/domains/team/team.queries";
// import { TeamsList } from "~/team/components/teams-list";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(teams)/teams")({
  validateSearch: z.object({
    name: teamSchema.shape.name
      .catch((e) => z.string().parse(e.value))
      .optional(),
  }),
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user?.emailVerifiedAt) {
      throw redirect({ to: "/sign-in" });
    }
  },
  loaderDeps: ({ search }) => ({
    name: search.name,
  }),
  loader: async ({ context, deps }) => {
    const queries = {
      all: teamQueries.all(deps.name),
    } as const;

    await context.queryClient.ensureInfiniteQueryData(queries.all);
  },
});

const RouteComponent = () => {
  return (
    <Main>
      <Header>
        {/*
        <FilterTeamsByName />
        */}
        <CreateTeamDialog />
      </Header>

      {/*
      <TeamsList />
    */}
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
  return <header className="grid grid-cols-[1fr_auto] gap-2" {...props} />;
};
