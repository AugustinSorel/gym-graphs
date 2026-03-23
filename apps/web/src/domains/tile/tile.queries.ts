import { infiniteQueryOptions } from "@tanstack/react-query";
// import { api } from "~/libs/api";
// import { parseJsonResponse } from "@gym-graphs/api";
// import type { Tile, Tag } from "@gym-graphs/db/schemas";
// import type { InferApiReqInput } from "@gym-graphs/api";

const all = (name?: Tile["name"], tags?: Array<Tag["name"]>) => {
  return infiniteQueryOptions({
    queryKey: ["dashboard", "tiles", name, tags],
    queryFn: async ({ pageParam, signal }) => {
      return [[]];
      // const req = api().tiles.$get;
      // const query: InferApiReqInput<typeof req>["query"] = {
      //   page: pageParam.toString(),
      // };
      // if (name) {
      //   query.name = name;
      // }
      // if (tags?.length) {
      //   query.tags = JSON.stringify(tags);
      // }
      // return parseJsonResponse(req({ query }, { init: { signal } }));
    },
    initialPageParam: 1,
    // getNextPageParam: (lastPage) => lastPage.nextCursor,
    getNextPageParam: () => 0,
    // select: (tiles) => tiles.pages.flatMap((pages) => pages.tiles),
    select: (tiles) => tiles.pages.flatMap((pages) => pages),
  });
};

export const tileQueries = {
  all,
};
