import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { tileQueries } from "~/domains/tile/tile.queries";

export const useTiles = () => {
  return useSuspenseInfiniteQuery(tileQueries.all());
};
