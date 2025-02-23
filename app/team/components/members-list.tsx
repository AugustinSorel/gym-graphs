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
import type { ComponentProps } from "react";

export const MembersList = () => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);
  const user = useUser();

  const members = team.data.members;

  if (!members.length) {
    return <NoMembersMsg>no members</NoMembersMsg>;
  }

  return (
    <List>
      {members.map((member) => (
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
      ))}
    </List>
  );
};

const NoMembersMsg = (props: ComponentProps<"p">) => {
  return (
    <p
      className="text-muted-foreground mx-3 mb-3 rounded border p-6 text-center lg:mx-6 lg:mb-6"
      {...props}
    />
  );
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

const MemberName = (props: ComponentProps<"h3">) => {
  return <h3 className="truncate font-semibold capitalize" {...props} />;
};
