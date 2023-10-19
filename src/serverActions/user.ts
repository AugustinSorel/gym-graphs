"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { privateAction } from "@/lib/safeAction";
import { deleteUserAccountSchema } from "@/schemas/userSchema";
import { eq } from "drizzle-orm";

export const deleteUserAccountAction = privateAction(
  deleteUserAccountSchema,
  async (_, ctx) => {
    await db.delete(users).where(eq(users.id, ctx.userId));
  }
);
