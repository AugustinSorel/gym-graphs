import { useSuspenseQuery } from "@tanstack/react-query";
import { userKeys } from "~/user/user.key";

export const useUser = () => {
  const user = useSuspenseQuery(userKeys.get);

  return user;
};
