"use client";

import { api } from "@/trpc/react";
import type { Team } from "@/server/db/types";

//FIXME: https://github.com/t3-oss/create-t3-app/issues/1765
// use the useSuspenseQuery rather
export const useTeam = (props: Pick<Team, "id">) => {
  const team = api.team.get.useQuery({ id: props.id }, { throwOnError: true });

  return team;
};
