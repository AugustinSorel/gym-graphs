import { useMutation } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/ui/alert-dialog";
import { Button } from "~/ui/button";
import { Spinner } from "~/ui/spinner";
import { getRouteApi } from "@tanstack/react-router";
import { useTransition } from "react";
import { useTeam } from "~/team/hooks/use-team";
import { leaveTeamAction } from "~/team/team.actions";
import { teamQueries } from "~/team/team.queries";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";

export const LeaveTeamDialog = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = routeApi.useNavigate();
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);
  const leaveTeam = useLeaveTeam();

  const leaveTeamHandler = () => {
    leaveTeam.mutate(
      { data: { teamId: team.data.id } },
      {
        onSuccess: () => {
          startRedirectTransition(async () => {
            await navigate({ to: "/teams" });
          });
        },
      },
    );
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          leave
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove all of
            your data from this team from our servers.
          </AlertDialogDescription>

          {leaveTeam.error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>{leaveTeam.error.message}</AlertDescription>
            </Alert>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={leaveTeam.isPending || isRedirectPending}
            onClick={(e) => {
              e.preventDefault();
              leaveTeamHandler();
            }}
          >
            <span>Leave</span>
            {(leaveTeam.isPending || isRedirectPending) && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const routeApi = getRouteApi("/(teams)/teams_/$teamId_/settings");

const useLeaveTeam = () => {
  return useMutation({
    mutationFn: leaveTeamAction,
    onMutate: (variables, ctx) => {
      const queries = {
        userAndPublicTeams: teamQueries.userAndPublicTeams().queryKey,
      } as const;

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
                    isUserInTeam: false,
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
