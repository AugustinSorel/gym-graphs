import { userQueries } from "~/domains/user/user.queries";

type UserData = Awaited<ReturnType<NonNullable<typeof userQueries.get["queryFn"]>>>;

export const userMock: UserData = {
  weightUnit: "kg",
  email: "john@email.com",
  name: "john",
  id: 1,
  oneRepMaxAlgo: "epley",
  dashboardView: "graph",
  verifiedAt: new Date(),
};
