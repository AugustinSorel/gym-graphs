import type { selectClientUser } from "./user.services";

export const userMock = {
  weightUnit: "kg",
  email: "john@email.com",
  name: "john",
  id: 1,
  tags: [],
  oneRepMaxAlgo: "epley",
} as const satisfies Awaited<ReturnType<typeof selectClientUser>>;
