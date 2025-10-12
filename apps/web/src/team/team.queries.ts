import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  selectTeamByIdAction,
  selectUserAndPublicTeamsAction,
} from "~/team/team.actions";
import type { Team } from "~/db/db.schemas";

const userAndPublicTeams = (name?: Team["name"]) =>
  infiniteQueryOptions({
    queryKey: ["teams", name],
    queryFn: ({ pageParam, signal }) => {
      return selectUserAndPublicTeamsAction({
        data: { page: pageParam, name },
        signal,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (tiles) => tiles.pages.flatMap((pages) => pages.teams),
  });

const get = (teamId: Team["id"]) => {
  return queryOptions({
    queryKey: ["teams", teamId],
    queryFn: ({ signal }) => selectTeamByIdAction({ data: { teamId }, signal }),
  });
};

export const teamQueries = {
  userAndPublicTeams,
  get,
};
