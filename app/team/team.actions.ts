import { createServerFn } from "@tanstack/react-start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { injectDbMiddleware } from "~/db/db.middlewares";
import {
  teamSchema,
  teamMemberSchema,
  teamInvitationSchema,
  teamJoinRequestSchema,
  teamEventReactionsSchema,
  teamNotificationSchema,
} from "~/team/team.schemas";
import {
  acceptInvitation,
  acceptTeamJoinRequest,
  changeTeamMemberRole,
  changeTeamVisibility,
  createTeam,
  createTeamEventReaction,
  createTeamInvitation,
  createTeamJoinRequest,
  createTeamMember,
  deleteTeamById,
  expireTeamInvitation,
  generateTeamInvitationToken,
  kickMemberOutOfTeam,
  leaveTeam,
  readTeamEventNotifications,
  rejectTeamJoinRequest,
  removeTeamEventReaction,
  renameTeamById,
  revokeTeamInvitation,
  selectMemberInTeamByEmail,
  selectTeamById,
  selectTeamInvitationByToken,
  selectTeamWithMembers,
  selectUserAndPublicTeams,
} from "~/team/team.services";
import pg from "pg";
import { z } from "zod";
import { redirect } from "@tanstack/react-router";
import {
  sendTeamInvitationEmail,
  sendTeamJoinRequestEmail,
} from "~/team/team.emails";
import { hashSHA256Hex } from "~/auth/auth.services";

export const selectUserAndPublicTeamsAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      name: teamSchema.shape.name
        .catch((e) => e.input)
        .optional()
        .transform((name) => name ?? ""),
      page: z.number().positive().catch(1),
    }),
  )
  .handler(async ({ context, data }) => {
    const pageSize = 100;

    const teams = await selectUserAndPublicTeams(
      context.user.id,
      data.page,
      data.name,
      pageSize,
      context.db,
    );

    const showNextPage = teams.length > pageSize - 1;
    const nextCursor = showNextPage ? data.page + 1 : null;

    return {
      teams,
      nextCursor,
    };
  });

export const createTeamAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(teamSchema.pick({ name: true, visibility: true }))
  .handler(async ({ context, data }) => {
    try {
      await context.db.transaction(async (tx) => {
        const team = await createTeam(data.name, data.visibility, tx);
        await createTeamMember(team.id, context.user.id, "admin", tx);
      });
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateTeam = dbError && e.constraint === "team_name_unique";

      if (duplicateTeam) {
        throw new Error("team already created");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const selectTeamByIdAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ teamId: teamSchema.shape.id }))
  .handler(async ({ context, data }) => {
    const team = await selectTeamById(context.user.id, data.teamId, context.db);

    if (!team) {
      throw redirect({ to: "/teams" });
    }

    return team;
  });

export const renameTeamAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      teamId: teamSchema.shape.id,
      name: teamSchema.shape.name,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      await renameTeamById(context.user.id, data.teamId, data.name, context.db);
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateTeam = dbError && e.constraint === "team_name_unique";

      if (duplicateTeam) {
        throw new Error("team already created");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const deleteTeamAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ teamId: teamSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await deleteTeamById(context.user.id, data.teamId, context.db);
  });

export const leaveTeamAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ teamId: teamSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await leaveTeam(context.user.id, data.teamId, context.db);
  });

export const kickMemberOutOfTeamAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      teamId: teamMemberSchema.shape.teamId,
      memberId: teamMemberSchema.shape.userId,
    }),
  )
  .handler(async ({ context, data }) => {
    await kickMemberOutOfTeam(
      context.user.id,
      data.memberId,
      data.teamId,
      context.db,
    );
  });

export const changeTeamMemberRoleAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      teamId: teamMemberSchema.shape.teamId,
      memberId: teamMemberSchema.shape.userId,
      role: teamMemberSchema.shape.role,
    }),
  )
  .handler(async ({ context, data }) => {
    await changeTeamMemberRole(
      context.user.id,
      data.memberId,
      data.teamId,
      data.role,
      context.db,
    );
  });

export const changeTeamVisibilityAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      teamId: teamSchema.shape.id,
      visibility: teamSchema.shape.visibility,
    }),
  )
  .handler(async ({ context, data }) => {
    await changeTeamVisibility(
      context.user.id,
      data.teamId,
      data.visibility,
      context.db,
    );
  });

export const inviteMemberToTeamAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      teamId: teamInvitationSchema.shape.teamId,
      newMemberEmail: teamInvitationSchema.shape.email,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      const token = generateTeamInvitationToken();
      const tokenHash = hashSHA256Hex(token);

      await context.db.transaction(async (tx) => {
        const memberInTeam = await selectMemberInTeamByEmail(
          data.newMemberEmail,
          data.teamId,
          tx,
        );

        if (memberInTeam) {
          throw new Error("User already joined the team.");
        }

        await createTeamInvitation(
          data.newMemberEmail,
          context.user.id,
          data.teamId,
          tokenHash,
          tx,
        );

        const team = await selectTeamById(context.user.id, data.teamId, tx);

        if (!team) {
          throw new Error("team not found");
        }

        await sendTeamInvitationEmail(data.newMemberEmail, team, token);
      });
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const invitationAlreadySent =
        dbError && e.constraint === "team_invitation_team_id_email_unique";

      if (invitationAlreadySent) {
        throw new Error("invitation already sent");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const revokeTeamInvitationAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      invitationId: teamInvitationSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    return revokeTeamInvitation(context.user.id, data.invitationId, context.db);
  });

export const acceptTeamInvitationAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      token: teamInvitationSchema.shape.token,
    }),
  )
  .handler(async ({ context, data }) => {
    const tokenHash = hashSHA256Hex(data.token);

    const invitation = await selectTeamInvitationByToken(tokenHash, context.db);

    if (!invitation) {
      throw new Error("Invalid invitation");
    }

    const invitationExpired = invitation.expiresAt < new Date();

    if (invitationExpired) {
      await expireTeamInvitation(invitation.id, context.db);

      throw new Error("Invitation has expired");
    }

    const memberInTeam = await selectMemberInTeamByEmail(
      invitation.email,
      invitation.teamId,
      context.db,
    );

    if (memberInTeam) {
      throw new Error("User already joined the team.");
    }

    await context.db.transaction(async (tx) => {
      await createTeamMember(invitation.teamId, context.user.id, "member", tx);
      await acceptInvitation(invitation.id, tx);
    });

    return invitation;
  });

export const createTeamJoinRequestAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ teamId: teamSchema.shape.id }))
  .handler(async ({ context, data }) => {
    const team = await selectTeamWithMembers(data.teamId, context.db);

    if (!team) {
      throw new Error("team not found");
    }

    const userIsInTeam = team.members.some((member) => {
      return member.userId === context.user.id;
    });

    if (userIsInTeam) {
      throw new Error("member already part of team");
    }

    const joinRequest = await createTeamJoinRequest(
      context.user.id,
      data.teamId,
      context.db,
    );

    if (joinRequest) {
      const adminsEmails = team.members
        .filter((member) => member.role === "admin")
        .map((adminMember) => adminMember.user.email);

      await sendTeamJoinRequestEmail(adminsEmails, team);
    }
  });

export const rejectTeamJoinRequestAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ joinRequestId: teamJoinRequestSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await rejectTeamJoinRequest(
      data.joinRequestId,
      context.user.id,
      context.db,
    );
  });

export const acceptTeamJoinRequestAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ joinRequestId: teamJoinRequestSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await context.db.transaction(async (tx) => {
      const joinRequest = await acceptTeamJoinRequest(
        data.joinRequestId,
        context.user.id,
        tx,
      );

      await createTeamMember(
        joinRequest.teamId,
        joinRequest.userId,
        "member",
        tx,
      );
    });
  });

export const createTeamEventReactionAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(teamEventReactionsSchema.pick({ emoji: true, teamEventId: true }))
  .handler(async ({ context, data }) => {
    try {
      await createTeamEventReaction(
        data.teamEventId,
        context.user.id,
        data.emoji,
        context.db,
      );
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateEvent =
        dbError &&
        e.constraint ===
          "team_event_reaction_team_event_id_user_id_emoji_unique";

      if (duplicateEvent) {
        throw new Error("event already created");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const removeTeamEventReactionAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(teamEventReactionsSchema.pick({ emoji: true, teamEventId: true }))
  .handler(async ({ context, data }) => {
    await removeTeamEventReaction(
      data.teamEventId,
      context.user.id,
      data.emoji,
      context.db,
    );
  });

export const readTeamNotificationsAciton = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(teamNotificationSchema.pick({ teamId: true }))
  .handler(async ({ context, data }) => {
    await readTeamEventNotifications(context.user.id, data.teamId, context.db);
  });
