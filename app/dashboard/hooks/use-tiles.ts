import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { dashboardQueries } from "~/dashboard/dashboard.queries";

export const useTiles = () => {
  const search = useSearch({ from: "/dashboard/" });

  return useSuspenseInfiniteQuery({
    ...dashboardQueries.tiles,
    select: (tiles) => {
      return tiles.pages.flatMap((page) => {
        return page.tiles.filter((tile) => {
          const nameMatches = tile.name.includes(search.name ?? "");

          const tagsMatch =
            !search.tags?.length ||
            tile.tags.find((tileTag) =>
              search.tags?.includes(tileTag.tag.name),
            );

          return nameMatches && tagsMatch;
        });
      });
    },
  });
};
