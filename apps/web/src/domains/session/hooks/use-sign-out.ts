import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";

export const useSignOut = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signOut = useMutation({
    mutationFn: async () => {
      const req = api().sessions.me.$delete();

      return parseJsonResponse(req);
    },
    onSuccess: () => {
      startRedirectTransition(async () => {
        await navigate({ to: "/" });
        queryClient.clear();
      });
    },
  });

  return {
    ...signOut,
    isPending: signOut.isPending || isRedirectPending,
  };
};
