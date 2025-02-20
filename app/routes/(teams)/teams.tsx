import { createFileRoute } from "@tanstack/react-router";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { permissions } from "~/libs/permissions";
import { FilterTeamsByName } from "~/team/components/filter-teams-by-name";
import { CreateTeamDialog } from "~/team/components/create-team-dialog";
import { z } from "zod";
import { teamSchema } from "~/team/team.schemas";
import { teamQueries } from "~/team/team.queries";
import { TeamsList } from "~/team/components/teams-list";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(teams)/teams")({
  validateSearch: z.object({
    name: teamSchema.shape.name.catch((e) => e.input).optional(),
  }),
  component: () => RouteComponent(),
  errorComponent: (props) => DefaultErrorFallback(props),
  beforeLoad: async ({ context }) => {
    permissions.teams.view(context.user);
  },
  loaderDeps: ({ search }) => ({
    name: search.name,
  }),
  loader: async ({ context }) => {
    const queries = {
      userAndPublicTeams: teamQueries.userAndPublicTeams,
    } as const;

    await context.queryClient.ensureQueryData(queries.userAndPublicTeams);
  },
});

const RouteComponent = () => {
  return (
    <Main>
      <Header>
        <FilterTeamsByName />
        <CreateTeamDialog />
      </Header>

      <TeamsList />
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
