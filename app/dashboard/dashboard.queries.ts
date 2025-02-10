import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  selectTilesFunFactsAction,
  selectTilesAction,
  selectTilesSetsHeatMap,
  selectTilesToSetsCountAction,
  selectTilesToTagsCountAction,
} from "~/dashboard/dashboard.actions";
import type { Tag, Tile } from "~/db/db.schemas";

const tiles = (name?: Tile["name"], tags?: Array<Tag["name"]>) =>
  infiniteQueryOptions({
    queryKey: ["dashboard", "tiles", name, tags],
    queryFn: ({ pageParam }) => {
      return selectTilesAction({
        data: { page: pageParam, name, tags },
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (tiles) => tiles.pages.flatMap((pages) => pages.tiles),
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
