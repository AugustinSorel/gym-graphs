import { useSuspenseQuery } from "@tanstack/react-query";
import { teamQueries } from "~/team/team.queries";
import type { Team } from "~/db/db.schemas";

export const useTeam = (teamId: Team["id"]) => {
  return useSuspenseQuery(teamQueries.get(teamId));
};
