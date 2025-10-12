import { getRouteApi } from "@tanstack/react-router";
import { useTeam } from "~/team/hooks/use-team";
import { useUser } from "~/user/hooks/use-user";
import { permissions } from "~/libs/permissions";
import type { PropsWithChildren } from "react";

export const TeamAdminGuard = (props: Readonly<PropsWithChildren>) => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);
  const user = useUser();

  const isAdmin = permissions.team.isAdmin(user.data, team.data.members);

  if (!isAdmin) {
    return null;
  }

  return props.children;
};

const routeApi = getRouteApi("/(teams)/teams_/$teamId_/settings");
