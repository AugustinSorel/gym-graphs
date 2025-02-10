import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  selectTilesFunFactsAction,
  selectTilesAction,
  selectTilesSetsHeatMap,
  selectTilesToSetsCountAction,
  selectTilesToTagsCountAction,
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
  queryKey: ["dashboard", "tiles", "fun-facts"],
  queryFn: () => selectTilesFunFactsAction(),
});

const tilesToSetsCount = queryOptions({
  queryKey: ["dashboard", "tiles", "sets-count"],
  queryFn: () => selectTilesToSetsCountAction(),
});

const tilesToTagsCount = queryOptions({
  queryKey: ["dashboard", "tiles", "tags-count"],
  queryFn: () => selectTilesToTagsCountAction(),
});

const tilesSetsHeatMap = queryOptions({
  queryKey: ["dashboard", "tiles", "sets-heat-map"],
  queryFn: () => selectTilesSetsHeatMap(),
});

export const dashboardQueries = {
  tiles,
  funFacts,
  tilesToSetsCount,
  tilesSetsHeatMap,
  tilesToTagsCount,
} as const;
