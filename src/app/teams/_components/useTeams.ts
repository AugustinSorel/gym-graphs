"use client";

import { api } from "@/trpc/react";

export const useTeams = () => {
  return api.team.all.useSuspenseQuery();
};
