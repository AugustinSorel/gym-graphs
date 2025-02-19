import { createServerFn } from "@tanstack/start";
import {
  authGuardMiddleware,
  rateLimiterMiddleware,
} from "~/auth/auth.middlewares";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { teamSchema } from "~/team/team.schemas";
import { createTeam, selectPublicTeams } from "~/team/team.services";
import pg from "pg";

export const selectPublicTeamsAction = createServerFn({ method: "GET" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    return selectPublicTeams(context.db);
  });

export const createTeamAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(teamSchema.pick({ name: true, isPublic: true }))
  .handler(async ({ context, data }) => {
    try {
      await createTeam(data.name, data.isPublic, context.db);
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateTeam = dbError && e.constraint === "team_name_unique";

      if (duplicateTeam) {
        throw new Error("team already created");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });
