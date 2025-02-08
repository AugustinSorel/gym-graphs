import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  selectDashboardFunFactsAction,
  selectTilesAction,
} from "~/dashboard/dashboard.actions";

const tiles = infiniteQueryOptions({
  queryKey: ["dashboard", "tiles"],
  queryFn: async ({ pageParam }) => {
    return await selectTilesAction({ data: { page: pageParam } });
  },
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

const funFacts = queryOptions({
  queryKey: ["dashboard", "fun-facts"],
  queryFn: () => selectDashboardFunFactsAction(),
});

export const dashboardKeys = {
  tiles,
  funFacts,
} as const;
