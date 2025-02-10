import { tagsMock } from "~/tag/tag.mock";
import type { selectUserAction } from "~/user/user.actions";

export const userMock: Readonly<
  NonNullable<Awaited<ReturnType<typeof selectUserAction>>>
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
