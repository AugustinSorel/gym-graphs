import { queryOptions } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { parseResponse } from "hono/client";
import { api } from "~/libs/api";

const get = queryOptions({
  queryKey: ["user"],
  queryFn: createIsomorphicFn()
    .server(async () => {
      //FIX
      const session = getCookie("session");

      const req = api.users.me.$get(undefined, {
        headers: { Cookie: `session=${session}` },
      });

      return parseResponse(req);
    })
    .client(async () => {
      return parseResponse(api.users.me.$get());
    }),
});

export const userQueries = {
  get,
};
