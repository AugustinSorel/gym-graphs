import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";
import { api } from "~/libs/api";

export const useSignOut = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signOut = useMutation({
    mutationFn: async () => api.sessions.me.$delete(),
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
