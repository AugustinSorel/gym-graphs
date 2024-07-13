"use client";

import { api } from "@/trpc/react";

export const useUser = () => {
  return api.user.get.useSuspenseQuery();
};
