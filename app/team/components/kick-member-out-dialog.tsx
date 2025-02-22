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
import { Spinner } from "~/ui/spinner";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { useState, useTransition } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useTeam } from "~/team/hooks/use-team";
import { teamQueries } from "~/team/team.queries";
import { useUser } from "~/user/hooks/use-user";
import { kickMemberOutOfTeamAction } from "~/team/team.actions";
import type { TeamsToUsers } from "~/db/db.schemas";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { CircleAlert } from "lucide-react";

export const KickMemberOutDialog = (props: Props) => {
  const kickMemberOut = useKickMemberOut(props.userId);
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const allowedToKickMemberOut = useAllowedToKickMemberOut(props.userId);
  const params = routeApi.useParams();
  const navigate = routeApi.useNavigate();
  const user = useUser();

  const kickMemberOutHandler = () => {
    kickMemberOut.mutate(
      {
        data: {
          userId: props.userId,
          teamId: params.teamId,
        },
      },
      {
        onSuccess: () => {
          console.log("SUCCESS");
          const userKickHimselfOut = props.userId === user.data.id;

          if (userKickHimselfOut) {
            startRedirectTransition(async () => {
              await navigate({ to: "/teams" });
            });
          }

          setIsOpen(false);
        },
      },
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={(e) => e.preventDefault()}
          disabled={!allowedToKickMemberOut}
        >
          kick out
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently kick this person
            out of your team and remove his team's data from our servers.
          </AlertDialogDescription>

          {kickMemberOut.error && (
            <Alert variant="destructive">
              <CircleAlert className="size-4" />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>{kickMemberOut.error.message}</AlertDescription>
            </Alert>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={kickMemberOut.isPending || isRedirectPending}
            onClick={(e) => {
              e.preventDefault();
              kickMemberOutHandler();
            }}
          >
            <span>Kick Out</span>
            {(kickMemberOut.isPending || isRedirectPending) && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const useKickMemberOut = (userId: Props["userId"]) => {
  const queryClient = useQueryClient();
  const user = useUser();
  const allowedToKickMemberOut = useAllowedToKickMemberOut(userId);

  return useMutation({
    mutationFn: kickMemberOutOfTeamAction,
    onMutate: (variables) => {
      if (!allowedToKickMemberOut) {
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
            return teamToUser.userId !== variables.data.userId;
          }),
        };
      });

      queryClient.setQueryData(queries.userAndPublicTeams, (teams) => {
        if (!teams) {
          return teams;
        }

        const isUserKickingHimselfOut = variables.data.userId === user.data.id;

        if (!isUserKickingHimselfOut) {
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

type Props = Readonly<{ userId: TeamsToUsers["userId"] }>;

const routeApi = getRouteApi("/(teams)/teams_/$teamId_/settings");

const useAllowedToKickMemberOut = (userId: Props["userId"]) => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  const teamMembership = team.data.teamToUsers.find((teamToUser) => {
    return teamToUser.userId === userId;
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
