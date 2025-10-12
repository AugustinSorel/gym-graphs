import { useUser } from "~/user/hooks/use-user";
import { useTeam } from "~/team/hooks/use-team";
import { getRouteApi } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";

export const AllowedToLeaveTeamGuard = (props: Props) => {
  const allowedToLeaveTeam = useAllowedToLeaveTeam();

  if (!allowedToLeaveTeam) {
    return null;
  }

  return props.children;
};

type Props = Readonly<PropsWithChildren>;

const routeApi = getRouteApi("/(teams)/teams_/$teamId_/settings");

const useAllowedToLeaveTeam = () => {
  const user = useUser();
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  const member = team.data.members.find((teamToUser) => {
    return teamToUser.userId === user.data.id;
  });

  if (!member) {
    return false;
  }

  if (member.role === "member") {
    return true;
  }

  const adminCounts = team.data.members.reduce((acc, curr) => {
    if (curr.role === "admin") {
      return acc + 1;
    }

    return acc;
  }, 0);

  return adminCounts > 1;
};
