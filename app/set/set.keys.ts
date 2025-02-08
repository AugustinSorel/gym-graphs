import { queryOptions } from "@tanstack/react-query";
import { selectSetsHeatMapAction } from "./set.actions";
import { User } from "~/db/db.schemas";

const heatMap = (userId: User["id"]) => {
  return queryOptions({
    queryKey: [userId, "sets", "heatMap"],
    queryFn: () => selectSetsHeatMapAction(),
  });
};

export const setKeys = {
  heatMap,
} as const;
