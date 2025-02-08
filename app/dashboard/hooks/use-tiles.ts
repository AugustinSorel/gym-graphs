import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { dashboardKeys } from "~/dashboard/dashboard.keys";

export const useTiles = () => {
  const search = useSearch({ from: "/dashboard/" });

  return useSuspenseInfiniteQuery({
    ...dashboardKeys.tiles,
    select: (tiles) => {
      return tiles.pages.flatMap((page) => {
        return page.tiles.filter((tile) => {
          if (tile.type !== "exercise") {
            return true;
          }

          const nameMatches = tile.exercise?.name.includes(search.name ?? "");

          const tagsMatch =
            !search.tags?.length ||
            tile.exercise?.tags.find((exerciseTag) =>
              search.tags?.includes(exerciseTag.tag.name),
            );

          return nameMatches && tagsMatch;
        });
      });
    },
  });
};
