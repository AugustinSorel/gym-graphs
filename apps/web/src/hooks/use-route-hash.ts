import { useNavigate, useRouterState } from "@tanstack/react-router";

export const useRouteHash = (hash: string) => {
  const navigate = useNavigate();

  const candidateHash = useRouterState({
    select: (state) => {
      return state.location.hash;
    },
  });

  const remove = () => {
    void navigate({ hash: "", resetScroll: false });
  };

  return {
    remove,
    isActive: candidateHash === hash,
    hash,
  };
};
