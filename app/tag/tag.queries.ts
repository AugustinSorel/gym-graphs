import { queryOptions } from "@tanstack/react-query";
import { selectTagsFrequencyAction } from "~/tag/tag.actions";

const frequency = queryOptions({
  queryKey: ["tags", "frequency"],
  queryFn: () => selectTagsFrequencyAction(),
});

export const tagQueries = {
  frequency,
} as const;
