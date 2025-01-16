import { useSuspenseQuery } from "@tanstack/react-query";
import { userKey } from "~/user/user.key";

export const useUser = () => {
  const user = useSuspenseQuery(userKey.get);

  return user;
};
