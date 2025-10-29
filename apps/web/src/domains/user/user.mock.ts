import { api } from "~/libs/api";
import { tagsMock } from "~/domains/tag/tag.mock";
import type { InferResponseType } from "hono";

export const userMock: Readonly<
  InferResponseType<ReturnType<typeof api>["users"]["me"]["$get"]>
> = {
  weightUnit: "kg",
  email: "john@email.com",
  name: "john",
  id: 1,
  dashboard: {
    id: 0,
  },
  tags: tagsMock,
  oneRepMaxAlgo: "epley",
  dashboardView: "graph",
};
