import { createServerFn } from "@tanstack/start";
import {
  authGuardMiddleware,
  rateLimiterMiddleware,
} from "~/auth/auth.middlewares";
import { injectDbMiddleware } from "~/db/db.middlewares";
import {
  teamSchema,
  teamMemberSchema,
  teamInvitationSchema,
  teamJoinRequestSchema,
} from "~/team/team.schemas";
import {
  acceptInvitation,
  acceptTeamJoinRequest,
  changeTeamMemberRole,
  changeTeamVisibility,
  createTeam,
  createTeamInvitation,
  createTeamJoinRequest,
  createTeamMember,
  deleteTeamById,
  expireTeamInvitation,
  generateTeamInvitationToken,
  kickMemberOutOfTeam,
  leaveTeam,
  rejectTeamJoinRequest,
  renameTeamById,
  revokeTeamInvitation,
  selectMemberInTeamByEmail,
  selectMemberInTeamById,
  selectTeamById,
  selectTeamInvitationByToken,
  selectUserAndPublicTeams,
} from "~/team/team.services";
import pg from "pg";
import { z } from "zod";
import { redirect } from "@tanstack/react-router";
import { sendTeamInvitationEmail } from "~/team/team.emails";
import { sha256Encode } from "~/auth/auth.services";

export const selectUserAndPublicTeamsAction = createServerFn({ method: "GET" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ page: z.number().positive().catch(1) }))
  .handler(async ({ context, data }) => {
    await new Promise((res) => setTimeout(res, 1000));
    const pageSize = 100;

    const teams = await selectUserAndPublicTeams(
      context.user.id,
      data.page,
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
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
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
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ teamId: teamSchema.shape.id }))
  .handler(async ({ context, data }) => {
    const team = await selectTeamById(context.user.id, data.teamId, context.db);

    if (!team) {
      throw redirect({ to: "/teams" });
    }

    return team;
  });

export const renameTeamAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
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
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ teamId: teamSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await deleteTeamById(context.user.id, data.teamId, context.db);
  });

export const leaveTeamAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ teamId: teamSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await leaveTeam(context.user.id, data.teamId, context.db);
  });

export const kickMemberOutOfTeamAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
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
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
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
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
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
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      teamId: teamInvitationSchema.shape.teamId,
      newMemberEmail: teamInvitationSchema.shape.email,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      const token = generateTeamInvitationToken();
      const tokenHash = await sha256Encode(token);

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
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      invitationId: teamInvitationSchema.shape.id,
    }),
  )
  .handler(async ({ context, data }) => {
    return revokeTeamInvitation(context.user.id, data.invitationId, context.db);
  });

export const acceptTeamInvitationAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      token: teamInvitationSchema.shape.token,
    }),
  )
  .handler(async ({ context, data }) => {
    const tokenHash = await sha256Encode(data.token);

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
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ teamId: teamSchema.shape.id }))
  .handler(async ({ context, data }) => {
    const member = await selectMemberInTeamById(
      context.user.id,
      data.teamId,
      context.db,
    );

    if (member) {
      throw new Error("member already part of team");
    }

    await createTeamJoinRequest(context.user.id, data.teamId, context.db);
  });

export const rejectTeamJoinRequestAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ joinRequestId: teamJoinRequestSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await rejectTeamJoinRequest(
      data.joinRequestId,
      context.user.id,
      context.db,
    );
  });

export const acceptTeamJoinRequestAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
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
