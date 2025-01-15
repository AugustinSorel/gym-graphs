import { useSuspenseQuery } from "@tanstack/react-query";
import { userKey } from "./user.key";

export const useUser = () => {
  const user = useSuspenseQuery(userKey.get);

  //TODO: remove \.data
  return user.data;
};

export const useUnsafeUser = () => {
  try {
    return useUser();
  } catch {
    return null;
  }
};
