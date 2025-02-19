import { queryOptions } from "@tanstack/react-query";
import { selectPublicTeamsAction } from "./team.actions";

const publicTeams = queryOptions({
  queryKey: ["teams"],
  queryFn: () => selectPublicTeamsAction(),
});

export const teamQueries = {
  publicTeams,
};
