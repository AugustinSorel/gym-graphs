import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { teamQueries } from "~/team/team.queries";
import { Badge } from "~/ui/badge";
import { getRouteApi, Link } from "@tanstack/react-router";
import { Button } from "~/ui/button";
import { Skeleton } from "~/ui/skeleton";
import { Suspense, type ComponentProps, type ComponentRef } from "react";

export const TeamsList = () => {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Content />
    </Suspense>
  );
};

export const Content = () => {
  const userAndPublicTeams = useUserAndPublicTeams();

  if (!userAndPublicTeams.data.length) {
    return <NoTeamsText>no teams</NoTeamsText>;
  }

  return (
    <List>
      {userAndPublicTeams.data.map((team, index) => (
        <Team
          key={team.id}
          isLastItem={index >= userAndPublicTeams.data.length - 1}
        >
          <Button variant="link" asChild className="absolute inset-0 h-auto">
            <Link to="/teams/$teamId" params={{ teamId: team.id }} />
          </Button>

          <TeamName>{team.name}</TeamName>
          {team.isUserInTeam && <Badge>joined</Badge>}
          <Badge variant="outline">{team.visibility}</Badge>
        </Team>
      ))}

      {userAndPublicTeams.isFetchingNextPage && <TeamsSkeleton />}
    </List>
  );
};

const routeApi = getRouteApi("/(teams)/teams");

const useUserAndPublicTeams = () => {
  const search = routeApi.useSearch();

  const keys = {
    userAndPublicTeams: teamQueries.userAndPublicTeams(search.name),
  } as const;

  return useSuspenseInfiniteQuery(keys.userAndPublicTeams);
};

const NoTeamsText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="text-muted-foreground rounded-md border p-6 text-center"
      {...props}
    />
  );
};

const List = (props: ComponentProps<"ul">) => {
  return <ul className="space-y-6" {...props} />;
};

const Team = ({
  isLastItem,
  ...props
}: ComponentProps<"li"> & { isLastItem: boolean }) => {
  const userAndPublicTeams = useUserAndPublicTeams();

  const fetchNextPageHandler = (e: ComponentRef<"li">) => {
    if (!isLastItem) {
      return () => null;
    }

    const observer = new IntersectionObserver(([tile]) => {
      if (!tile?.isIntersecting || !userAndPublicTeams.hasNextPage) {
        return;
      }

      void userAndPublicTeams.fetchNextPage();
    });

    observer.observe(e);

    return () => observer.unobserve(e);
  };

  return (
    <li
      ref={(e) => {
        if (!e) {
          return;
        }

        const tearDownHandler = fetchNextPageHandler(e);

        return () => {
          tearDownHandler();
        };
      }}
      className="bg-secondary hover:bg-accent relative grid grid-flow-col grid-cols-[1fr] items-center gap-3 rounded-lg border p-6 transition-colors hover:[&>[data-team-name]]:underline"
      {...props}
    />
  );
};

const TeamName = (props: ComponentProps<"span">) => {
  return <span className="truncate font-semibold" data-team-name {...props} />;
};

const TeamsSkeleton = () => {
  return [...new Array(10).keys()].map((i) => <TeamSkeleton key={i} />);
};

export const TeamSkeleton = () => {
  return (
    <li>
      <Skeleton className="bg-secondary flex items-center gap-3 rounded-lg border p-6.75">
        <TeamName className="bg-muted h-4 w-42 rounded-lg" />
        <Badge variant="outline" className="bg-muted ml-auto h-5 w-14" />
      </Skeleton>
    </li>
  );
};

const ListSkeleton = () => {
  return (
    <List>
      <TeamsSkeleton />
    </List>
  );
};
