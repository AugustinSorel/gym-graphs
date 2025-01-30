import { queryOptions } from "@tanstack/react-query";
import { DashboardTile } from "~/db/db.schemas";
import { getUserAction, selectDashboardTilesAction } from "~/user/user.actions";

const get = queryOptions({
  queryKey: ["user"],
  queryFn: () => getUserAction(),
});

const getDashboardTiles = (userId: DashboardTile["userId"]) =>
  queryOptions({
    queryKey: ["user", userId, "dashboard-tiles"],
    queryFn: () => selectDashboardTilesAction(),
  });

export const userKeys = {
  get,
  getDashboardTiles,
};
