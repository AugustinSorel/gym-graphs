import { users } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { userSchema } from "@/schemas/user.schema";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
      with: {
        stats: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "user not found" });
    }

    return user;
  }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(users).where(eq(users.id, ctx.session.user.id));
  }),

  rename: protectedProcedure
    .input(userSchema.pick({ name: true }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ name: input.name })
        .where(eq(users.id, ctx.session.user.id));
    }),
});
