import { queryOptions } from "@tanstack/react-query";
import type { CurrentSessionSchema } from "@gym-graphs/shared/auth/schemas";

const get = queryOptions<(typeof CurrentSessionSchema.Type)["user"]>({
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
