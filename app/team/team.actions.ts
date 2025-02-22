import { createServerFn } from "@tanstack/start";
import {
  authGuardMiddleware,
  rateLimiterMiddleware,
} from "~/auth/auth.middlewares";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { teamSchema } from "~/team/team.schemas";
import {
  createTeam,
  createTeamToUser,
  deleteTeamById,
  leaveTeam,
  renameTeamById,
  selectTeamById,
  selectUserAndPublicTeams,
} from "~/team/team.services";
import pg from "pg";
import { z } from "zod";
import { redirect } from "@tanstack/react-router";

export const selectUserAndPublicTeamsAction = createServerFn({ method: "GET" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    return selectUserAndPublicTeams(context.user.id, context.db);
  });

export const createTeamAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(teamSchema.pick({ name: true, isPublic: true }))
  .handler(async ({ context, data }) => {
    try {
      await context.db.transaction(async (tx) => {
        const team = await createTeam(data.name, data.isPublic, tx);
        await createTeamToUser(team.id, context.user.id, "admin", tx);
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
