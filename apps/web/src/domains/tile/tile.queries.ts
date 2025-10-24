import { infiniteQueryOptions } from "@tanstack/react-query";
import type { Tile, Tag } from "@gym-graphs/api/db";
import { api, parseJsonResponse } from "~/libs/api";

const all = (name?: Tile["name"], tags?: Array<Tag["name"]>) =>
  infiniteQueryOptions({
    queryKey: ["dashboard", "tiles", name, tags],
    queryFn: async ({ pageParam, signal }) => {
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

      const res = await parseJsonResponse(req);

      return {
        ...res,
        tiles: res.tiles.map((tile) => {
          if (tile.type === "exerciseOverview") {
            return {
              ...tile,
              exerciseOverview: {
                ...tile.exerciseOverview,
                exercise: {
                  ...tile.exerciseOverview.exercise,
                  sets: tile.exerciseOverview.exercise.sets.map((set) => {
                    return {
                      ...set,
                      doneAt: new Date(set.doneAt),
                    };
                  }),
                },
              },
            };
          }

          return tile;
        }),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (tiles) => tiles.pages.flatMap((pages) => pages.tiles),
  });

export const tileQueries = {
  all,
};
