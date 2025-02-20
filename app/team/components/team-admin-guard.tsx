import { getRouteApi } from "@tanstack/react-router";
import { PropsWithChildren } from "react";
import { useTeam } from "~/team/hooks/use-team";
import { useUser } from "~/user/hooks/use-user";

export const TeamAdminGuard = (props: Readonly<PropsWithChildren>) => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);
  const user = useUser();

  const userInTeam = team.data.teamToUsers.find(
    (teamToUser) => teamToUser.userId === user.data.id,
  );

  if (userInTeam?.role !== "admin") {
    return null;
  }

  return props.children;
};

const routeApi = getRouteApi("/(teams)/teams_/$teamId_/settings");
