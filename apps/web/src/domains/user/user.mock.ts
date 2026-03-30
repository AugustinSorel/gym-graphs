import { useUser } from "~/domains/user/hooks/use-user";

export const userMock: ReturnType<typeof useUser>["data"] = {
  weightUnit: "kg",
  email: "john@email.com",
  name: "john",
  id: 1,
  oneRepMaxAlgo: "epley",
  dashboardView: "graph",
  verifiedAt: new Date(),
};
