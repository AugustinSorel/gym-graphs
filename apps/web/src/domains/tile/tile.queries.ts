import { SelectAllDashboardTilesUrlParams } from "@gym-graphs/shared/dashboard-tile/schemas";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { callApi } from "~/libs/api";

const all = (
  urlParams?: Omit<typeof SelectAllDashboardTilesUrlParams.Encoded, "cursor">,
) => {
  return infiniteQueryOptions({
    queryKey: ["dashboard-tiles", urlParams?.name, urlParams?.tags],
    queryFn: async ({ pageParam }) => {
      return callApi((api) =>
        api.DashboardTile.all({
          urlParams: {
            ...urlParams,
            cursor: pageParam,
          },
        }),
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (tiles) => tiles.pages.flatMap((pages) => pages.dashboardTiles),
  });
};

const tags = (tileId: number) =>
  queryOptions({
    queryKey: ["dashboard-tiles", tileId, "tags"],
    queryFn: async () =>
      callApi((api) => api.DashboardTile.getTags({ path: { tileId } })),
  });

export const tileQueries = {
  all,
  tags,
};
