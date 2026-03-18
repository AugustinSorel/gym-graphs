import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";
import { callApi } from "~/libs/api";

export const useSignOut = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signOut = useMutation({
    mutationFn: async () => {
      return callApi((api) => api.Auth.signOut());
    },
    onSuccess: () => {
      startRedirectTransition(async () => {
        queryClient.clear();
        await navigate({ to: "/" });
      });
    },
  });

  return {
    ...signOut,
    isPending: signOut.isPending || isRedirectPending,
  };
};
