import { queryOptions } from "@tanstack/react-query";
import { selectUserAndPublicTeamsAction } from "~/team/team.actions";

const userAndPublicTeams = queryOptions({
  queryKey: ["teams"],
  queryFn: () => selectUserAndPublicTeamsAction(),
});

export const teamQueries = {
  userAndPublicTeams,
};
