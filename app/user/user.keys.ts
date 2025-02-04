import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { DashboardTile } from "~/db/db.schemas";
import { getUserAction, selectDashboardTilesAction } from "~/user/user.actions";

const get = queryOptions({
  queryKey: ["user"],
  queryFn: () => getUserAction(),
});

const dashboardTiles = (userId: DashboardTile["userId"]) =>
  infiniteQueryOptions({
    queryKey: ["user", userId, "dashboard-tiles"],
    queryFn: async ({ pageParam }) => {
      return await selectDashboardTilesAction({ data: { page: pageParam } });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

export const userKeys = {
  get,
  dashboardTiles,
};
