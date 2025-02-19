import { createFileRoute } from "@tanstack/react-router";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { permissions } from "~/libs/permissions";
import { FilterTeamsByName } from "~/team/components/filter-teams-by-name";
import { CreateTeamDialog } from "~/team/components/create-team-dialog";
import { z } from "zod";
import { teamSchema } from "~/team/team.schemas";
import { teamQueries } from "~/team/team.queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(teams)/teams")({
  validateSearch: z.object({
    name: teamSchema.shape.name.catch((e) => e.input).optional(),
  }),
  component: () => RouteComponent(),
  errorComponent: (props) => DefaultErrorFallback(props),
  beforeLoad: async ({ context }) => {
    permissions.team.view(context.user);
  },
  loaderDeps: ({ search }) => ({
    name: search.name,
  }),
  loader: async ({ context }) => {
    const queries = {
      publicTeams: teamQueries.publicTeams,
    } as const;

    await context.queryClient.ensureQueryData(queries.publicTeams);
  },
});

const RouteComponent = () => {
  const publicTeams = usePublicTeams();

  return (
    <Main>
      <Header>
        <FilterTeamsByName />
        <CreateTeamDialog />
      </Header>
      <pre>{JSON.stringify(publicTeams.data, null, 2)}</pre>
    </Main>
  );
};

const usePublicTeams = () => {
  return useSuspenseQuery(teamQueries.publicTeams);
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
