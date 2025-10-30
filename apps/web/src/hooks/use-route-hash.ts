import { useLocation, useNavigate } from "@tanstack/react-router";

export const useRouteHash = (hash: string) => {
  const navigate = useNavigate();

  const candidateHash = useLocation().hash;

  const remove = () => {
    void navigate({ hash: "", resetScroll: false });
  };

  return {
    remove,
    isActive: candidateHash === hash,
    hash,
  };
};
