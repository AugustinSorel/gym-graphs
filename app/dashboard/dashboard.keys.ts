import { infiniteQueryOptions } from "@tanstack/react-query";
import type { Dashboard } from "~/db/db.schemas";
import { selectTilesAction } from "~/dashboard/dashboard.actions";

const tiles = (userId: Dashboard["userId"]) =>
  infiniteQueryOptions({
    queryKey: ["user", userId, "dashboard-tiles"],
    queryFn: async ({ pageParam }) => {
      return await selectTilesAction({ data: { page: pageParam } });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

export const dashboardKeys = {
  tiles,
};
