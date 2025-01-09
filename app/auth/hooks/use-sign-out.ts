import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";
import { signOutAction } from "~/auth/auth.actions";

export const useSignOut = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = useNavigate();

  const signOut = useMutation({
    mutationFn: signOutAction,
    onSuccess: () => {
      startRedirectTransition(async () => {
        await navigate({ to: "/sign-in" });
      });
    },
  });

  return {
    ...signOut,
    isPending: signOut.isPending || isRedirectPending,
  };
};
