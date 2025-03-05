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
    queryFn: ({ pageParam, signal }) => {
      return selectTilesAction({
        data: { page: pageParam, name, tags },
        signal,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (tiles) => tiles.pages.flatMap((pages) => pages.tiles),
  });

const funFacts = queryOptions({
  queryKey: ["dashboard", "tiles", "fun-facts"],
  queryFn: ({ signal }) => selectTilesFunFactsAction({ signal }),
});

const tilesToSetsCount = queryOptions({
  queryKey: ["dashboard", "tiles", "sets-count"],
  queryFn: ({ signal }) => selectTilesToSetsCountAction({ signal }),
});

const tilesToTagsCount = queryOptions({
  queryKey: ["dashboard", "tiles", "tags-count"],
  queryFn: ({ signal }) => selectTilesToTagsCountAction({ signal }),
});

const tilesSetsHeatMap = queryOptions({
  queryKey: ["dashboard", "tiles", "sets-heat-map"],
  queryFn: ({ signal }) => selectTilesSetsHeatMap({ signal }),
});

export const dashboardQueries = {
  tiles,
  funFacts,
  tilesToSetsCount,
  tilesSetsHeatMap,
  tilesToTagsCount,
} as const;
