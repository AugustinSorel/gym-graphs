import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  selectDashboardFunFactsAction,
  selectTilesAction,
} from "~/dashboard/dashboard.actions";
import type { Dashboard } from "~/db/db.schemas";

const tiles = (userId: Dashboard["userId"]) =>
  infiniteQueryOptions({
    queryKey: ["user", userId, "dashboard-tiles"],
    queryFn: async ({ pageParam }) => {
      return await selectTilesAction({ data: { page: pageParam } });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

const funFacts = (userId: Dashboard["userId"]) => {
  return queryOptions({
    queryKey: ["user", userId, "fun-facts"],
    queryFn: () => selectDashboardFunFactsAction(),
  });
};

export const dashboardKeys = {
  tiles,
  funFacts,
};
