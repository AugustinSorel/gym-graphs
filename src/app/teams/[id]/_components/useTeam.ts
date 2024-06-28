//FIXME: https://github.com/t3-oss/create-t3-app/issues/1765

import { api } from "@/trpc/react";
import { useTeamPageParams } from "./useTeamPageParams";

// use the useSuspenseQuery rather
export const useTeam = () => {
  const searchParams = useTeamPageParams();
  const team = api.team.get.useQuery({ id: searchParams.id });

  return team;
};
