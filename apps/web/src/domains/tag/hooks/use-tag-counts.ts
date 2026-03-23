import { useSuspenseQuery } from "@tanstack/react-query";
import { useTiles } from "~/domains/tile/hooks/use-tiles";
import { tagQueries } from "../tag.queries";

export const useTagCounts = () => {
  const tiles = useTiles();
  const tags = useSuspenseQuery(tagQueries.all);

  const map = tiles.data
    .flatMap((tile) => tile.tileToTags)
    .reduce((map, tile) => {
      map.set(tile.tagId, (map.get(tile.tagId) ?? 0) + 1);

      return map;
    }, new Map<number, number>());

  return tags.data.map((tag) => ({
    ...tag,
    count: map.get(tag.id) ?? 0,
  }));
};
