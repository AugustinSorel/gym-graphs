import { getRouteApi } from "@tanstack/react-router";
import { useTeam } from "~/team/hooks/use-team";
import { Badge } from "~/ui/badge";
import { TeamAdminGuard } from "~/team/components/team-admin-guard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import { Button } from "~/ui/button";
import { MoreHorizontal } from "lucide-react";
import { KickMemberOutDialog } from "~/team/components/kick-member-out-dialog";
import { useUser } from "~/user/hooks/use-user";
import { ChangeMemberRoleDialog } from "~/team/components/change-member-role-dialog";
import { TeamMemberProvider } from "~/team/team-member.context";
import { inferNameFromEmail } from "~/user/user.utils";
import { RevokeInvitationDialog } from "~/team/components/revoke-invitation-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rejectTeamJoinRequestAction } from "~/team/team.actions";
import { Spinner } from "~/ui/spinner";
import type { ComponentProps } from "react";
import { teamQueries } from "../team.queries";

export const MembersList = () => {
  return (
    <List>
      <PendingJoinRequests />
      <PendingInvitations />
      <TeamMembers />
    </List>
  );
};

const PendingJoinRequests = () => {
  const pendingJoinRequests = usePendingJoinRequests();
  const rejectJoinRequest = useRejectJoinRequest();

  return pendingJoinRequests.map((joinRequest) => (
    <JoinRequest key={joinRequest.id}>
      <MemberName>{inferNameFromEmail(joinRequest.user.email)}</MemberName>
      <Button size="sm">accept</Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={rejectJoinRequest.isPending}
        onClick={() => {
          rejectJoinRequest.mutate({
            data: {
              joinRequestId: joinRequest.id,
            },
          });
        }}
      >
        <span>reject</span>
        {rejectJoinRequest.isPending && <Spinner />}
      </Button>
    </JoinRequest>
  ));
};

const PendingInvitations = () => {
  const pendingInvitations = usePendingInvitations();

  return pendingInvitations.map((invitation) => (
    <Invitation key={invitation.id}>
      <MemberName>{inferNameFromEmail(invitation.email)}</MemberName>

      <Badge variant="warning" className="w-max">
        pending...
      </Badge>

      <TeamAdminGuard>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="size-8">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <RevokeInvitationDialog invitationId={invitation.id} />
          </DropdownMenuContent>
        </DropdownMenu>
      </TeamAdminGuard>
    </Invitation>
  ));
};

const TeamMembers = () => {
  const members = useTeamMembers();
  const user = useUser();

  return members.map((member) => (
    <Member key={member.userId}>
      <MemberName>{member.user.name}</MemberName>

      <Badge
        variant={member.role === "admin" ? "default" : "outline"}
        className="w-max"
      >
        {member.role}
      </Badge>

      {member.userId !== user.data.id && (
        <TeamAdminGuard>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <TeamMemberProvider value={member}>
                <ChangeMemberRoleDialog />
                <KickMemberOutDialog />
              </TeamMemberProvider>
            </DropdownMenuContent>
          </DropdownMenu>
        </TeamAdminGuard>
      )}
    </Member>
  ));
};

const usePendingJoinRequests = () => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  return team.data.joinRequests.filter((joinRequest) => {
    return joinRequest.status === "pending";
  });
};

const usePendingInvitations = () => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  return team.data.invitations.filter((invitation) => {
    return invitation.status === "pending";
  });
};

const useTeamMembers = () => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  return team.data.members;
};

const useRejectJoinRequest = () => {
  const params = routeApi.useParams();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectTeamJoinRequestAction,
    onMutate: (variables) => {
      const queries = {
        team: teamQueries.get(params.teamId).queryKey,
      } as const;

      queryClient.setQueryData(queries.team, (team) => {
        if (!team) {
          return team;
        }

        return {
          ...team,
          joinRequests: team.joinRequests.filter((joinRequest) => {
            return joinRequest.id !== variables.data.joinRequestId;
          }),
        };
      });
    },
    onSettled: () => {
      const queries = {
        team: teamQueries.get(params.teamId),
      } as const;

      void queryClient.invalidateQueries(queries.team);
    },
  });
};

const routeApi = getRouteApi("/(teams)/teams_/$teamId_/settings");

const List = (props: ComponentProps<"ul">) => {
  return (
    <ul
      className="mx-3 mb-3 max-h-96 items-center overflow-auto rounded-md border lg:mx-6 lg:mb-6"
      {...props}
    />
  );
};

const Member = (props: ComponentProps<"li">) => {
  return (
    <li
      className="hover:bg-accent grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4 text-sm transition-colors"
      {...props}
    />
  );
};

const Invitation = (props: ComponentProps<"li">) => {
  return (
    <li
      className="hover:bg-accent grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4 text-sm transition-colors"
      {...props}
    />
  );
};

const JoinRequest = (props: ComponentProps<"li">) => {
  return (
    <li
      className="hover:bg-accent grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4 text-sm transition-colors"
      {...props}
    />
  );
};

const MemberName = (props: ComponentProps<"h3">) => {
  return <h3 className="truncate font-semibold capitalize" {...props} />;
};
