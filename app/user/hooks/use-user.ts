import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/user/user.queries";

export const useUser = () => {
  const user = useSuspenseQuery(userQueries.get);

  return user;
};
