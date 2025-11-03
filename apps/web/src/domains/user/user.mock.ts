import { tagsMock } from "~/domains/tag/tag.mock";
import { useUser } from "~/domains/user/hooks/use-user";

export const userMock: ReturnType<typeof useUser>["data"] = {
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
