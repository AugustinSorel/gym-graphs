import { useLocation, useRouter } from "@tanstack/react-router";

export const useRouteHash = (hash: string) => {
  const candidateHash = useLocation().hash;

  const router = useRouter();

  const remove = () => {
    router.history.back();
  };

  return {
    remove,
    isActive: candidateHash === hash,
    hash,
  };
};
