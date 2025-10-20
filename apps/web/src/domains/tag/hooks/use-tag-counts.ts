import { useTiles } from "~/domains/tile/hooks/use-tiles";
import { useUser } from "~/domains/user/hooks/use-user";

export const useTagCounts = () => {
  const tiles = useTiles();
  const tags = useUser().data.tags;

  const map = tiles.data
    .flatMap((x) => x.tileToTags)
    .reduce((map, tile) => {
      map.set(tile.tagId, (map.get(tile.tagId) ?? 0) + 1);

      return map;
    }, new Map<number, number>());

  return tags.map((tag) => ({
    ...tag,
    count: map.get(tag.id) ?? 0,
  }));
};
