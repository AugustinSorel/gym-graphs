import { teamSchema } from "@gym-graphs/schemas/team";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuthMiddleware } from "~/domains/session/session.middlewares";
import { teamService } from "~/domains/team/team.service";
import type { Ctx } from "~/index";

export const teamRouter = new Hono<Ctx>()
  .get(
    "/",
    requireAuthMiddleware,
    zValidator(
      "query",
      z.object({
        name: teamSchema.shape.name
          .catch((e) => z.string().catch("").parse(e.value))
          .optional()
          .default(""),
        page: z.number().positive().catch(1),
      }),
    ),

    async (c) => {
      const query = c.req.valid("query");

      const teams = await teamService.selectInfinite(
        c.var.user.id,
        query.name,
        query.page,
        c.var.db,
      );

      return c.json(teams, 200);
    },
  )
  .post(
    "/",
    requireAuthMiddleware,
    zValidator("json", teamSchema.pick({ name: true, visibility: true })),
    async (c) => {
      const input = c.req.valid("json");

      await teamService.create(
        c.var.user.id,
        input.name,
        input.visibility,
        c.var.db,
      );

      return c.json(null, 200);
    },
  );
