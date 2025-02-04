import { createServerFn } from "@tanstack/start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { userSchema } from "~/user/user.schemas";
import {
  deleteUser,
  renameUser,
  reorderDashboardTiles,
  selectClientUser,
  selectDashboardTiles,
  updateOneRepMaxAlgo,
  updateWeightUnit,
} from "~/user/user.services";
import { deleteSessionTokenCookie } from "~/auth/auth.cookies";
import { setResponseStatus } from "vinxi/http";
import { dashboardTileSchema } from "~/user/user.schemas";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { z } from "zod";
import { and, eq, inArray, sql, SQL } from "drizzle-orm";
import { dashboardTileTable } from "~/db/db.schemas";

export const getUserAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    const user = await selectClientUser(context.user.id, context.db);

    if (!user) {
      setResponseStatus(404);
      throw new Error("user not found");
    }

    return user;
  });

export const selectDashboardTilesAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      page: z.number().positive().catch(1),
    }),
  )
  .handler(async ({ context, data }) => {
    const pageSize = 100;

    const tiles = await selectDashboardTiles(
      context.user.id,
      data.page,
      pageSize,
      context.db,
    );

    const showNextPage = tiles.length > 1;
    const nextCursor = showNextPage ? data.page + 1 : null;

    return {
      tiles,
      nextCursor,
    };
  });

export const renameUserAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ name: true }))
  .handler(async ({ data, context }) => {
    await renameUser(data.name, context.user.id, context.db);
  });

export const deleteAccountAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    await deleteUser(context.user.id, context.db);
    deleteSessionTokenCookie();
  });

export const updateWeightUnitAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ weightUnit: true }))
  .handler(async ({ context, data }) => {
    await updateWeightUnit(data.weightUnit, context.user.id, context.db);
  });

export const updateOneRepMaxAlgoAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ oneRepMaxAlgo: true }))
  .handler(async ({ context, data }) => {
    await updateOneRepMaxAlgo(data.oneRepMaxAlgo, context.user.id, context.db);
  });

export const updateDashboardTilesOrderAction = createServerFn({
  method: "POST",
})
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(dashboardTileSchema.pick({ id: true }).array().max(200))
  .handler(async ({ context, data }) => {
    await reorderDashboardTiles(
      data.toReversed().flatMap((d) => d.id),
      context.user.id,
      context.db,
    );
  });
