import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { permissions } from "~/libs/permissions";
import { teamQueries } from "~/team/team.queries";
import { teamSchema } from "~/team/team.schemas";
import { Button } from "~/ui/button";
import { useTeam } from "~/team/hooks/use-team";
import { ArrowLeftIcon, CheckIcon, SettingsIcon, LockIcon } from "~/ui/icons";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTeamJoinRequestAction,
  readTeamNotificationsAciton,
} from "~/team/team.actions";
import { Spinner } from "~/ui/spinner";
import { HideAfter } from "~/ui/hide-after";
import { TeamEventsTimeline } from "~/team/components/team-events-timeline";
import { Separator } from "~/ui/separator";
import { TeamFunFactsGrid } from "~/team/components/team-fun-facts-grid";
import { userQueries } from "~/user/user.queries";
import { useEffect } from "react";
import { Badge } from "~/ui/badge";
import type { ComponentProps } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { Team } from "~/db/db.schemas";

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

    const team = await context.queryClient.ensureQueryData(queries.team);

    void readTeamNotificationsAciton({
      data: { teamId: params.teamId },
    });

    nukeCachedTeamNotifications(
      context.queryClient,
      params.teamId,
      team.events.reduce((acc, curr) => acc + curr.notifications.length, 0),
    );
  },
});

const PublicTeamPage = () => {
  const params = Route.useParams();
  const team = useTeam(params.teamId);

  const createTeamJoinRequest = useCreateTeamJoinRequest();

  const createTeamJoinRequestHandler = () => {
    createTeamJoinRequest.mutate({
      data: {
        teamId: team.data.id,
      },
    });
  };

  return (
    <Main>
      <Header>
        <Title>{team.data.name}</Title>
        <Button
          size="sm"
          disabled={createTeamJoinRequest.isPending}
          onClick={() => {
            createTeamJoinRequestHandler();
          }}
        >
          <span>join team</span>
          {createTeamJoinRequest.isPending && <Spinner />}
          {createTeamJoinRequest.isSuccess && (
            <HideAfter>
              <CheckIcon />
            </HideAfter>
          )}
        </Button>
        <Button
          asChild
          variant="link"
          className="text-muted-foreground mr-auto p-0"
        >
          <Link to="..">
            <ArrowLeftIcon />
            <span>back</span>
          </Link>
        </Button>
      </Header>

      <Alert className="flex flex-col items-center justify-center gap-5 border-none text-center">
        <div className="w-max rounded-full border-2 border-current p-5">
          <LockIcon className="size-24 stroke-1" />
        </div>
        <AlertTitle className="text-4xl font-bold first-letter:capitalize">
          this team is private
        </AlertTitle>
        <AlertDescription className="text-muted-foreground text-base">
          join this team to view it&apos;s content
        </AlertDescription>
      </Alert>
    </Main>
  );
};

const useCreateTeamJoinRequest = () => {
  return useMutation({
    mutationFn: createTeamJoinRequestAction,
  });
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
            <SettingsIcon className="lg:hidden" />
          </Link>
        </Button>
        <Button
          asChild
          variant="link"
          className="text-muted-foreground mr-auto p-0"
        >
          <Link to="..">
            <ArrowLeftIcon />
            <span>back</span>
          </Link>
        </Button>
      </Header>

      <Separator />

      <Section>
        <SubTitle>team overview</SubTitle>
        <TeamFunFactsGrid />
      </Section>

      <Section>
        <SubTitle>
          team events <NewNotificationsBadge />
        </SubTitle>
        <TeamEventsTimeline />
      </Section>
    </Main>
  );
};

const NewNotificationsBadge = () => {
  const params = Route.useParams();
  const team = useTeam(params.teamId);
  const queryClient = useQueryClient();

  const nukeCachedTeamEventsNotifications = () => {
    const queries = {
      team: teamQueries.get(params.teamId).queryKey,
    } as const;

    queryClient.setQueryData(queries.team, (team) => {
      if (!team) {
        return team;
      }

      return {
        ...team,
        events: team.events.map((event) => {
          return {
            ...event,
            notifications: [],
          };
        }),
      };
    });
  };

  useEffect(() => {
    return () => {
      nukeCachedTeamEventsNotifications();
    };
  }, []);

  const notifications = team.data.events.flatMap((e) => e.notifications);

  if (!notifications.length) {
    return null;
  }

  return <Badge className="ml-1">{notifications.length} new</Badge>;
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

const SubTitle = (props: ComponentProps<"h2">) => {
  return (
    <h2 className="truncate text-xl font-semibold capitalize" {...props} />
  );
};

const Section = (props: ComponentProps<"section">) => {
  return <section className="space-y-10" {...props} />;
};

const nukeCachedTeamNotifications = (
  queryClient: QueryClient,
  teamId: Team["id"],
  eventNotificationCount: any,
) => {
  const queries = {
    userAndPublicTeams: teamQueries.userAndPublicTeams().queryKey,
    user: userQueries.get.queryKey,
  } as const;

  queryClient.setQueryData(queries.user, (user) => {
    if (!user) {
      return user;
    }

    return {
      ...user,
      teamNotificationCount:
        user.teamNotificationCount - eventNotificationCount,
    };
  });

  queryClient.setQueryData(queries.userAndPublicTeams, (teams) => {
    if (!teams) {
      return teams;
    }

    return {
      ...teams,
      pages: teams.pages.map((page) => {
        return {
          ...page,
          teams: page.teams.map((team) => {
            if (team.id === teamId) {
              return {
                ...team,
                eventNotificationCount: 0,
              };
            }
            return team;
          }),
        };
      }),
    };
  });
};
