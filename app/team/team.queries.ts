import { queryOptions } from "@tanstack/react-query";
import {
  selectTeamByIdAction,
  selectUserAndPublicTeamsAction,
} from "~/team/team.actions";
import type { Team } from "~/db/db.schemas";

const userAndPublicTeams = queryOptions({
  queryKey: ["teams"],
  queryFn: () => selectUserAndPublicTeamsAction(),
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
