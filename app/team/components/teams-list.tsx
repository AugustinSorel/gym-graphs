import { useSuspenseQuery } from "@tanstack/react-query";
import { teamQueries } from "~/team/team.queries";
import { Badge } from "~/ui/badge";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

export const TeamsList = () => {
  const userAndPublicTeams = useUserAndPublicTeams();

  if (!userAndPublicTeams.data.length) {
    return <NoTeamsText>no teams</NoTeamsText>;
  }

  return (
    <List>
      {userAndPublicTeams.data.map((team) => (
        <Team key={team.id}>
          {team.isUserInTeam && (
            <Link
              className="absolute inset-0"
              to="/teams/$teamId"
              params={{ teamId: team.id }}
            />
          )}

          <TeamName>{team.name}</TeamName>
          {team.isUserInTeam && <Badge>joined</Badge>}
          <Badge variant="outline">
            {team.isPublic ? "public" : "private"}
          </Badge>
        </Team>
      ))}
    </List>
  );
};

const useUserAndPublicTeams = () => {
  return useSuspenseQuery(teamQueries.userAndPublicTeams);
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

const Team = (props: ComponentProps<"li">) => {
  return (
    <li
      className="bg-secondary relative grid grid-flow-col grid-cols-[1fr] items-center gap-3 rounded-lg border p-6"
      {...props}
    />
  );
};

const TeamName = (props: ComponentProps<"span">) => {
  return <span className="truncate font-semibold" {...props} />;
};
