import { teams, usersToTeams } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { teamSchema } from "@/schemas/team.schemas";
import { TRPCError } from "@trpc/server";

export const teamRouter = createTRPCRouter({
  create: protectedProcedure
    .input(teamSchema.pick({ name: true }))
    .mutation(async ({ ctx, input }) => {
      const [team] = await ctx.db
        .insert(teams)
        .values({
          name: input.name,
          authorId: ctx.session.user.id,
        })
        .returning();

      if (!team) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "new team has not returned",
        });
      }

      await ctx.db.insert(usersToTeams).values({
        memberId: ctx.session.user.id,
        teamId: team.id,
      });
    }),

  get: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.usersToTeams.findMany({
      where: (table, { eq }) => eq(table.memberId, ctx.session.user.id),
      with: {
        team: true,
      },
    });
  }),
});
