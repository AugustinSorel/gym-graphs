import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { tileQueries } from "~/domains/tile/tile.queries";
import type { Tag, Tile } from "@gym-graphs/api";

export const useTiles = (name?: Tile["name"], tags?: Array<Tag["name"]>) => {
  return useSuspenseInfiniteQuery(tileQueries.all(name, tags));
};
