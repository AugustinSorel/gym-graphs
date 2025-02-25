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
import { useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { teamQueries } from "~/team/team.queries";
import { useUser } from "~/user/hooks/use-user";
import { kickMemberOutOfTeamAction } from "~/team/team.actions";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { CircleAlert } from "lucide-react";
import { useTeamMember } from "~/team/team-member.context";

export const KickMemberOutDialog = () => {
  const kickMemberOut = useKickMemberOut();
  const [isOpen, setIsOpen] = useState(false);
  const params = routeApi.useParams();
  const member = useTeamMember();

  const kickMemberOutHandler = () => {
    kickMemberOut.mutate(
      {
        data: {
          memberId: member.userId,
          teamId: params.teamId,
        },
      },
      {
        onSuccess: () => {
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
            disabled={kickMemberOut.isPending}
            onClick={(e) => {
              e.preventDefault();
              kickMemberOutHandler();
            }}
          >
            <span>Kick Out</span>
            {kickMemberOut.isPending && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const useKickMemberOut = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: kickMemberOutOfTeamAction,
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
          members: team.members.filter((member) => {
            return member.userId !== variables.data.memberId;
          }),
        };
      });

      queryClient.setQueryData(queries.userAndPublicTeams, (teams) => {
        if (!teams) {
          return teams;
        }

        const isUserKickingHimselfOut =
          variables.data.memberId === user.data.id;

        if (!isUserKickingHimselfOut) {
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

const routeApi = getRouteApi("/(teams)/teams_/$teamId_/settings");
