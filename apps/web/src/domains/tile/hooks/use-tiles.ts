import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { tileQueries } from "~/domains/tile/tile.queries";

export const useTiles = () => {
  const search = useSearch({ from: "/(dashboard)/dashboard" });

  return useSuspenseInfiniteQuery(tileQueries.all(search.name, search.tags));
};
