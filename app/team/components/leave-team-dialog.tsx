import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";
import { useTeam } from "~/team/hooks/use-team";
import { leaveTeamAction } from "~/team/team.actions";
import { teamQueries } from "~/team/team.queries";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircle, CircleAlert } from "lucide-react";
import { useUser } from "~/user/hooks/use-user";

export const LeaveTeamDialog = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = useNavigate();
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);
  const leaveTeam = useLeaveTeam();
  const allowedToLeaveTeam = useAllowedToLeaveTeam();

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
      {!allowedToLeaveTeam && (
        <p className="text-muted-foreground mr-2 flex items-center gap-2 text-center text-sm">
          <AlertCircle className="size-4 shrink-0" />
          You cannot leave the team because you are the only admin.
        </p>
      )}

      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={!allowedToLeaveTeam}>
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
              <CircleAlert className="size-4" />
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

const useAllowedToLeaveTeam = () => {
  const user = useUser();
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  const teamMembership = team.data.teamToUsers.find((teamToUser) => {
    return teamToUser.userId === user.data.id;
  });

  if (!teamMembership) {
    return false;
  }

  if (teamMembership.role === "member") {
    return true;
  }

  const adminCount = team.data.teamToUsers.reduce((acc, curr) => {
    if (curr.role === "admin") {
      return acc + 1;
    }

    return acc;
  }, 0);

  return adminCount > 1;
};

const useLeaveTeam = () => {
  const queryClient = useQueryClient();
  const allowedToLeaveTeam = useAllowedToLeaveTeam();
  const user = useUser();

  return useMutation({
    mutationFn: leaveTeamAction,
    onMutate: (variables) => {
      if (!allowedToLeaveTeam) {
        return;
      }

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
          teamToUsers: team.teamToUsers.filter((teamToUser) => {
            return teamToUser.userId !== user.data.id;
          }),
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
              isUserInTeam: false,
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
