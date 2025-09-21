import { useMutation } from "@tanstack/react-query";
import { Switch } from "~/ui/switch";
import { teamQueries } from "~/team/team.queries";
import { useTeam } from "~/team/hooks/use-team";
import { getRouteApi } from "@tanstack/react-router";
import { changeTeamVisibilityAction } from "~/team/team.actions";

export const ChangeTeamVisibilitySwitch = () => {
  const changeTeamVisibility = useChangeTeamVisibility();
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  return (
    <Switch
      checked={team.data.visibility === "public"}
      onCheckedChange={(isPublic) => {
        changeTeamVisibility.mutate({
          data: {
            teamId: team.data.id,
            visibility: isPublic ? "public" : "private",
          },
        });
      }}
    />
  );
};

const routeApi = getRouteApi("/(teams)/teams_/$teamId_/settings");

const useChangeTeamVisibility = () => {
  return useMutation({
    mutationFn: changeTeamVisibilityAction,
    onMutate: (variables, ctx) => {
      const queries = {
        team: teamQueries.get(variables.data.teamId).queryKey,
        userAndPublicTeams: teamQueries.userAndPublicTeams().queryKey,
      } as const;

      ctx.client.setQueryData(queries.team, (team) => {
        if (!team) {
          return team;
        }

        return {
          ...team,
          visibility: variables.data.visibility,
        };
      });

      ctx.client.setQueryData(queries.userAndPublicTeams, (teams) => {
        if (!teams) {
          return teams;
        }

        return {
          ...teams,
          pages: teams.pages.map((page) => {
            return {
              ...page,
              teams: page.teams.map((team) => {
                if (team.id === variables.data.teamId) {
                  return {
                    ...team,
                    visibility: variables.data.visibility,
                  };
                }

                return team;
              }),
            };
          }),
        };
      });
    },
    onSettled: (_data, _error, variables, _res, ctx) => {
      const queries = {
        team: teamQueries.get(variables.data.teamId),
        userAndPublicTeams: teamQueries.userAndPublicTeams(),
      } as const;

      void ctx.client.invalidateQueries(queries.team);
      void ctx.client.invalidateQueries(queries.userAndPublicTeams);
    },
  });
};
