import { SelectAllDashboardTilesUrlParams } from "@gym-graphs/shared/dashboard-tile/schemas";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { callApi } from "~/libs/api";

const all = (
  urlParams?: Omit<typeof SelectAllDashboardTilesUrlParams.Encoded, "page">,
) => {
  return infiniteQueryOptions({
    queryKey: ["dashboard-tiles", urlParams?.name, urlParams?.tags],
    queryFn: async ({ pageParam }) => {
      return callApi((api) =>
        api.DashboardTile.all({
          urlParams: {
            ...urlParams,
            page: pageParam,
          },
        }),
      );
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (tiles) => tiles.pages.flatMap((pages) => pages.dashboardTiles),
  });
};

export const tileQueries = {
  all,
};
