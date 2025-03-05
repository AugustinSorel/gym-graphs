import { queryOptions } from "@tanstack/react-query";
import { selectUserAction } from "~/user/user.actions";

const get = queryOptions({
  queryKey: ["user"],
  queryFn: ({ signal }) => selectUserAction({ signal }),
});

export const userQueries = {
  get,
} as const;
