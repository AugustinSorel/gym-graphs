import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  selectTeamByIdAction,
  selectUserAndPublicTeamsAction,
} from "~/team/team.actions";
import type { Team } from "~/db/db.schemas";

const userAndPublicTeams = infiniteQueryOptions({
  queryKey: ["teams"],
  queryFn: ({ pageParam }) => {
    return selectUserAndPublicTeamsAction({
      data: { page: pageParam },
    });
  },
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  select: (tiles) => tiles.pages.flatMap((pages) => pages.teams),
});

const get = (teamId: Team["id"]) => {
  return queryOptions({
    queryKey: ["teams", teamId],
    queryFn: () => selectTeamByIdAction({ data: { teamId } }),
  });
};

export const teamQueries = {
  userAndPublicTeams,
  get,
};
