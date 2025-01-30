import { useSuspenseQuery } from "@tanstack/react-query";
import { useUser } from "~/user/hooks/use-user";
import { useSearch } from "@tanstack/react-router";
import { userKeys } from "../user.key";

export const useDashboardTiles = () => {
  const user = useUser();
  const search = useSearch({ strict: false });

  return useSuspenseQuery({
    ...userKeys.getDashboardTiles(user.data.id),
    select: (tiles) => {
      return tiles.filter((tile) => {
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
    },
  });
};
