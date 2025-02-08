import { queryOptions } from "@tanstack/react-query";
import { selectTagsFrequencyAction } from "~/tag/tag.actions";
import type { User } from "~/db/db.schemas";

const frequency = (userId: User["id"]) => {
  return queryOptions({
    queryKey: [userId, "tags", "frequency"],
    queryFn: () => selectTagsFrequencyAction(),
  });
};

export const tagKeys = {
  frequency,
} as const;
