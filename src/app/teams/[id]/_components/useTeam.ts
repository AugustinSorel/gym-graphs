"use client";

import { api } from "@/trpc/react";
import type { Team } from "@/server/db/types";

export const useTeam = (props: Pick<Team, "id">) => {
  return api.team.get.useSuspenseQuery({ id: props.id });
};
