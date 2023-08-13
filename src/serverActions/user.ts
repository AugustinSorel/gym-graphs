"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { User } from "next-auth";

type DeleteUserAccountAction = {
  userId: User["id"];
};

export const deleteUserAccountAction = async (
  props: DeleteUserAccountAction
) => {
  await db.delete(users).where(eq(users.id, props.userId));
};
