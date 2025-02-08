import { queryOptions } from "@tanstack/react-query";
import { getUserAction } from "~/user/user.actions";

const get = queryOptions({
  queryKey: ["user"],
  queryFn: () => getUserAction(),
});

export const userKeys = {
  get,
} as const;
