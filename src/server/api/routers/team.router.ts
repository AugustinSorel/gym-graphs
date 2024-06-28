import { teamInvites, teams, usersToTeams } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { teamSchema } from "@/schemas/team.schemas";
import { TRPCError } from "@trpc/server";
import { userSchema } from "@/schemas/user.schema";
import { sendInviteToTeamEmail } from "@/lib/email";
import { eq } from "drizzle-orm";
import { teamInviteSchema } from "@/schemas/teamInvite.schema";

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

      return team;
    }),

  all: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.usersToTeams.findMany({
      where: (table, { eq }) => eq(table.memberId, ctx.session.user.id),
      with: {
        team: true,
      },
      orderBy: (table, { desc }) => desc(table.createdAt),
    });
  }),

  get: protectedProcedure
    .input(teamSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.db.query.teams.findFirst({
        where: (teams, { eq }) => eq(teams.id, input.id),
        with: {
          usersToTeams: {
            with: {
              team: {
                with: {
                  teamInvite: true,
                },
              },
              user: {
                with: {
                  exercises: {
                    with: {
                      data: {
                        orderBy: (data, { asc }) => [asc(data.doneAt)],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!team) {
        throw new TRPCError({ code: "NOT_FOUND", message: "team not found" });
      }

      return team;
    }),

  invite: protectedProcedure
    .input(
      userSchema.pick({ email: true }).merge(teamSchema.pick({ id: true })),
    )
    .mutation(async ({ input, ctx }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [invite] = await ctx.db
        .insert(teamInvites)
        .values({
          expiresAt,
          email: input.email,
          teamId: input.id,
        })
        .returning();

      if (!invite) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "invite could not be created",
        });
      }

      await sendInviteToTeamEmail({ to: input.email, token: invite.token });
    }),

  join: protectedProcedure
    .input(
      teamSchema
        .pick({ id: true })
        .merge(teamInviteSchema.pick({ token: true })),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(usersToTeams).values({
        memberId: ctx.session.user.id,
        teamId: input.id,
      });

      await ctx.db
        .update(teamInvites)
        .set({ accepted: true })
        .where(eq(teamInvites.token, input.token));
    }),

  getInvite: protectedProcedure
    .input(teamInviteSchema.pick({ token: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.teamInvites.findFirst({
        where: (table, { eq }) => eq(table.token, input.token),
      });
    }),
});
