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
import { Spinner } from "~/ui/spinner";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { useState } from "react";
import { revokeTeamInvitationAction } from "~/team/team.actions";
import { teamQueries } from "~/team/team.queries";
import type { TeamInvitation } from "~/db/db.schemas";
import { getRouteApi } from "@tanstack/react-router";

export const RevokeInvitationDialog = (props: Props) => {
  const revokeInvitation = useRevokeInvitation();
  const [isOpen, setIsOpen] = useState(false);

  const revokeInvitationHandler = () => {
    revokeInvitation.mutate(
      {
        data: {
          invitationId: props.invitationId,
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
          revoke
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently revoke this
            invitation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={revokeInvitation.isPending}
            onClick={(e) => {
              e.preventDefault();
              revokeInvitationHandler();
            }}
          >
            <span>Revoke</span>
            {revokeInvitation.isPending && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

type Props = Readonly<{
  invitationId: TeamInvitation["id"];
}>;

const routeApi = getRouteApi("/(teams)/teams_/$teamId_/settings");

const useRevokeInvitation = () => {
  const params = routeApi.useParams();

  return useMutation({
    mutationFn: revokeTeamInvitationAction,
    onMutate: (variables, ctx) => {
      const queries = {
        team: teamQueries.get(params.teamId).queryKey,
      } as const;

      ctx.client.setQueryData(queries.team, (team) => {
        if (!team) {
          return team;
        }

        return {
          ...team,
          invitations: team.invitations.filter((invitation) => {
            return invitation.id !== variables.data.invitationId;
          }),
        };
      });
    },
    onSettled: (_data, _err, _variables, _res, ctx) => {
      const queries = {
        team: teamQueries.get(params.teamId),
      } as const;

      void ctx.client.invalidateQueries(queries.team);
    },
  });
};
