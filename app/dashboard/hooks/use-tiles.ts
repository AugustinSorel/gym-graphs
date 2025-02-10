import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { dashboardQueries } from "~/dashboard/dashboard.queries";

export const useTiles = () => {
  const search = useSearch({ from: "/dashboard/" });

  const keys = {
    tiles: dashboardQueries.tiles(search.name, search.tags),
  } as const;

  return useSuspenseInfiniteQuery(keys.tiles);
};
