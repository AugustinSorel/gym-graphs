"use client";

import { api } from "@/trpc/react";

//FIXME: https://github.com/t3-oss/create-t3-app/issues/1765
// use the useSuspenseQuery rather
export const useTeams = () => {
  const teams = api.team.all.useQuery(undefined, {
    throwOnError: true,
  });

  return teams;
};
