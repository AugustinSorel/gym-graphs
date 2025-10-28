import { infiniteQueryOptions } from "@tanstack/react-query";
import { api, parseJsonResponse } from "~/libs/api";
import type { Tile, Tag } from "@gym-graphs/api";
import { InferRequestType } from "hono";

const all = (name?: Tile["name"], tags?: Array<Tag["name"]>) => {
  return infiniteQueryOptions({
    queryKey: ["dashboard", "tiles", name, tags],
    queryFn: async ({ pageParam, signal }) => {
      const req = api().tiles.$get;

      const query: InferRequestType<typeof req>["query"] = {
        page: pageParam.toString(),
      };

      if (name) {
        query.name = name;
      }

      if (tags?.length) {
        query.tags = JSON.stringify(tags);
      }

      return parseJsonResponse(req({ query }, { init: { signal } }));
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (tiles) => tiles.pages.flatMap((pages) => pages.tiles),
  });
};

export const tileQueries = {
  all,
};
