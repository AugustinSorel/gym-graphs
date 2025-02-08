import { tagsMock } from "~/tag/tag.mock";
import type { selectClientUser } from "~/user/user.services";

export const userMock: Readonly<
  NonNullable<Awaited<ReturnType<typeof selectClientUser>>>
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
};
