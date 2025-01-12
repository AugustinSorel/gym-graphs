import { validateSessionToken } from "~/auth/auth.services";

export const userMock = {
  weightUnit: "kg",
  email: "john@email.com",
  name: "john",
  id: 1,
  tags: [],
} as const satisfies NonNullable<
  Awaited<ReturnType<typeof validateSessionToken>>["user"]
>;
