import { queryOptions } from "@tanstack/react-query";
import type { CurrentUser } from "@gym-graphs/shared/auth/schemas";

const get = queryOptions<CurrentUser>({
  queryKey: ["user"],
  staleTime: Infinity,
  gcTime: Infinity,
  queryFn: async () => {
    throw new Error("user not set in query option");
  },
});

export const userQueries = {
  get,
};
