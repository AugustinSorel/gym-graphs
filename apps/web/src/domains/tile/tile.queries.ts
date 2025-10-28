import { infiniteQueryOptions } from "@tanstack/react-query";
import { api, parseJsonResponse } from "~/libs/api";
import type { Tile, Tag } from "@gym-graphs/api";

const all = (name?: Tile["name"], tags?: Array<Tag["name"]>) => {
  return infiniteQueryOptions({
    queryKey: ["dashboard", "tiles", name, tags],
    queryFn: async ({ pageParam, signal }) => {
      const req = api().tiles.$get(
        {
          query: {
            page: pageParam.toString(),
            name: name ?? "",
            tags: JSON.stringify(tags),
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
};

export const tileQueries = {
  all,
};
