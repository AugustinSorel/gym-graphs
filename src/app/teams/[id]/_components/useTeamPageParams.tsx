"use client";

import { useParams } from "next/navigation";
import { teamPageParamsSchema } from "./teamPageParams";

export const useTeamPageParams = () => {
  const unsafeParams = useParams();
  const params = teamPageParamsSchema.parse(unsafeParams);

  return params;
};
