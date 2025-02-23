import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeTeamVisibilityAction,
    onMutate: (variables) => {
      const queries = {
        team: teamQueries.get(variables.data.teamId).queryKey,
        userAndPublicTeams: teamQueries.userAndPublicTeams.queryKey,
      } as const;

      queryClient.setQueryData(queries.team, (team) => {
        if (!team) {
          return team;
        }

        return {
          ...team,
          visibility: variables.data.visibility,
        };
      });

      queryClient.setQueryData(queries.userAndPublicTeams, (teams) => {
        if (!teams) {
          return teams;
        }

        return teams.map((team) => {
          if (team.id === variables.data.teamId) {
            return {
              ...team,
              visibility: variables.data.visibility,
            };
          }

          return team;
        });
      });
    },
    onSettled: (_data, _error, variables) => {
      const queries = {
        team: teamQueries.get(variables.data.teamId),
        userAndPublicTeams: teamQueries.userAndPublicTeams,
      } as const;

      void queryClient.invalidateQueries(queries.team);
      void queryClient.invalidateQueries(queries.userAndPublicTeams);
    },
  });
};
