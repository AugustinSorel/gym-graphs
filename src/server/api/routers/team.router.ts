import { teamInvites, teams, usersToTeams } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { teamSchema } from "@/schemas/team.schemas";
import { TRPCError } from "@trpc/server";
import { userSchema } from "@/schemas/user.schema";
import { sendInviteToTeamEmail } from "@/lib/email";
import { and, eq } from "drizzle-orm";
import { teamInviteSchema } from "@/schemas/teamInvite.schema";
import { isPgError } from "@/server/db/utils";

export const teamRouter = createTRPCRouter({
  create: protectedProcedure
    .input(teamSchema.pick({ name: true }))
    .mutation(async ({ ctx, input }) => {
      const [team] = await (async () => {
        try {
          return await ctx.db
            .insert(teams)
            .values({
              name: input.name,
              authorId: ctx.session.user.id,
            })
            .returning();
        } catch (e) {
          if (isPgError(e) && e.code === "23505") {
            throw new TRPCError({
              code: "CONFLICT",
              message: `${input.name} is already used`,
            });
          }

          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      })();

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
      with: {
        team: {
          with: {
            author: true,
          },
        },
      },
      where: (table, { eq }) => eq(table.memberId, ctx.session.user.id),
      orderBy: (table, { desc }) => desc(table.createdAt),
    });
  }),

  get: protectedProcedure
    .input(teamSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.teams.findFirst({
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
      await ctx.db.transaction(async (tx) => {
        await tx.insert(usersToTeams).values({
          memberId: ctx.session.user.id,
          teamId: input.id,
        });

        await tx
          .update(teamInvites)
          .set({ accepted: true })
          .where(eq(teamInvites.token, input.token));
      });
    }),

  getInvite: protectedProcedure
    .input(teamInviteSchema.pick({ token: true }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.teamInvites.findFirst({
        where: (table, { eq }) => eq(table.token, input.token),
      });
    }),

  leave: protectedProcedure
    .input(teamSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(usersToTeams)
          .where(
            and(
              eq(usersToTeams.teamId, input.id),
              eq(usersToTeams.memberId, ctx.session.user.id),
            ),
          );

        await tx.delete(teamInvites).where(eq(teamInvites.teamId, input.id));
      });
    }),

  rename: protectedProcedure
    .input(teamSchema.pick({ id: true, name: true }))
    .mutation(async ({ ctx, input }) => {
      const [team] = await ctx.db
        .update(teams)
        .set({ name: input.name })
        .where(eq(teams.id, input.id))
        .returning();

      if (!team) {
        throw new TRPCError({ code: "NOT_FOUND", message: "team not found" });
      }

      return team;
    }),

  delete: protectedProcedure
    .input(teamSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(teams)
        .where(
          and(eq(teams.id, input.id), eq(teams.authorId, ctx.session.user.id)),
        );
    }),
});
