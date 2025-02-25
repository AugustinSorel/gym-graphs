import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { permissions } from "~/libs/permissions";
import { teamQueries } from "~/team/team.queries";
import { teamSchema } from "~/team/team.schemas";
import { Button } from "~/ui/button";
import { useTeam } from "~/team/hooks/use-team";
import { ArrowLeft, Cog, Lock } from "lucide-react";
import { Separator } from "~/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(teams)/teams_/$teamId")({
  params: z.object({
    teamId: z.coerce.number().pipe(teamSchema.shape.id),
  }),
  component: () => {
    const params = Route.useParams();
    const team = useTeam(params.teamId);

    if (!team.data.memberInTeam) {
      return PublicTeamPage();
    }

    return PrivateTeamPage();
  },
  beforeLoad: async ({ context }) => {
    permissions.team.view(context.user);
  },
  loader: async ({ params, context }) => {
    const queries = {
      team: teamQueries.get(params.teamId),
    } as const;

    await context.queryClient.ensureQueryData(queries.team);
  },
});

const PublicTeamPage = () => {
  const params = Route.useParams();
  const team = useTeam(params.teamId);

  return (
    <Main>
      <Header>
        <Title>{team.data.name}</Title>
        <Button size="sm">join team</Button>
        <Button
          asChild
          variant="link"
          className="text-muted-foreground mr-auto p-0"
        >
          <Link to="..">
            <ArrowLeft />
            <span>back</span>
          </Link>
        </Button>
      </Header>

      <Alert className="flex flex-col items-center justify-center gap-5 border-none text-center">
        <div className="w-max rounded-full border-2 border-current p-5">
          <Lock className="size-24 stroke-1" />
        </div>
        <AlertTitle className="text-4xl font-bold capitalize">
          this team is private
        </AlertTitle>
        <AlertDescription className="text-muted-foreground text-base">
          join this team to view it&apos;s content
        </AlertDescription>
      </Alert>
    </Main>
  );
};

const PrivateTeamPage = () => {
  const params = Route.useParams();
  const team = useTeam(params.teamId);

  return (
    <Main>
      <Header>
        <Title>{team.data.name}</Title>
        <Button variant="outline" size="sm" asChild>
          <Link
            to="/teams/$teamId/settings"
            from={Route.fullPath}
            aria-label="team settings"
          >
            <span className="hidden lg:inline-flex">settings</span>
            <Cog className="lg:hidden" />
          </Link>
        </Button>
        <Button
          asChild
          variant="link"
          className="text-muted-foreground mr-auto p-0"
        >
          <Link to="..">
            <ArrowLeft />
            <span>back</span>
          </Link>
        </Button>
      </Header>

      <Separator />
    </Main>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="max-w-app mx-auto flex flex-col gap-10 px-2 pt-10 pb-20 lg:gap-20 lg:px-4 lg:pt-20"
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid grid-cols-[1fr_auto] gap-2" {...props} />;
};

const Title = (props: ComponentProps<"h1">) => {
  return (
    <h1 className="truncate text-3xl font-semibold capitalize" {...props} />
  );
};
