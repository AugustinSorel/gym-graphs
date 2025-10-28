import { infiniteQueryOptions } from "@tanstack/react-query";
import type { Team } from "@gym-graphs/api";
import { api, parseJsonResponse } from "~/libs/api";
import { InferRequestType } from "hono";

const all = (name?: Team["name"]) =>
  infiniteQueryOptions({
    queryKey: ["teams", name],
    queryFn: ({ pageParam, signal }) => {
      const req = api().teams.$get;

      const query: InferRequestType<typeof req>["query"] = {
        page: pageParam.toString(),
      };

      if (name) {
        query.name = name;
      }

      return parseJsonResponse(req({ query }, { init: { signal } }));
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (tiles) => tiles.pages.flatMap((pages) => pages.teams),
  });

// const get = (teamId: Team["id"]) => {
//   return queryOptions({
//     queryKey: ["teams", teamId],
//     queryFn: ({ signal }) => selectTeamByIdAction({ data: { teamId }, signal }),
//   });
// };

export const teamQueries = {
  all,
  // get,
};
