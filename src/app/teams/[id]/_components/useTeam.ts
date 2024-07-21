"use client";

import { api, type RouterOutputs } from "@/trpc/react";

export const useTeam = (props: Pick<RouterOutputs["team"]["get"], "id">) => {
  return api.team.get.useSuspenseQuery({ id: props.id });
};
