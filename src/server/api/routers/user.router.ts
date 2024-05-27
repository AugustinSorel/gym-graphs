import { users } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";

export const userRouter = createTRPCRouter({
  delete: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(users).where(eq(users.id, ctx.session.user.id));
  }),
});
