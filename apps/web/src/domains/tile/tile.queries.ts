import { infiniteQueryOptions } from "@tanstack/react-query";
import type { Tile, Tag } from "@gym-graphs/api/db";
import { api, parseJsonResponse } from "~/libs/api";

const all = (name?: Tile["name"], tags?: Array<Tag["name"]>) =>
  infiniteQueryOptions({
    queryKey: ["dashboard", "tiles", name, tags],
    queryFn: ({ pageParam, signal }) => {
      const req = api().tiles.$get(
        {
          query: {
            page: pageParam.toString(),
            name: name ?? "",
            tags: tags ?? [],
          },
        },
        { init: { signal } },
      );

      return parseJsonResponse(req);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (tiles) => tiles.pages.flatMap((pages) => pages.tiles),
  });

export const tileQueries = {
  all,
} as const;
