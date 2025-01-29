import { createServerFn } from "@tanstack/start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { userSchema } from "~/user/user.schemas";
import {
  deleteDashboardTiles,
  deleteUser,
  insertDashboardTiles,
  renameUser,
  selectClientUser,
  updateOneRepMaxAlgo,
  updateWeightUnit,
} from "~/user/user.services";
import { db } from "~/libs/db.lib";
import { deleteSessionTokenCookie } from "~/auth/auth.cookies";
import { setResponseStatus } from "vinxi/http";
import { dashboardTileSchema } from "~/user/user.schemas";

export const getUserAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware])
  .handler(async ({ context }) => {
    const user = await selectClientUser(context.user.id, db);

    if (!user) {
      setResponseStatus(404);
      throw new Error("user not found");
    }

    return user;
  });

export const renameUserAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware])
  .validator(userSchema.pick({ name: true }))
  .handler(async ({ data, context }) => {
    await renameUser(data.name, context.user.id, db);
  });

export const deleteAccountAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware])
  .handler(async ({ context }) => {
    await deleteUser(context.user.id, db);
    deleteSessionTokenCookie();
  });

export const updateWeightUnitAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware])
  .validator(userSchema.pick({ weightUnit: true }))
  .handler(async ({ context, data }) => {
    await updateWeightUnit(data.weightUnit, context.user.id, db);
  });

export const updateOneRepMaxAlgoAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware])
  .validator(userSchema.pick({ oneRepMaxAlgo: true }))
  .handler(async ({ context, data }) => {
    await updateOneRepMaxAlgo(data.oneRepMaxAlgo, context.user.id, db);
  });

export const updateDashboardTilesOrderAction = createServerFn({
  method: "POST",
})
  .middleware([authGuardMiddleware])
  .validator(
    dashboardTileSchema.pick({ type: true, exerciseId: true }).array().max(200),
  )
  .handler(async ({ context, data }) => {
    await db.transaction(async (tx) => {
      await deleteDashboardTiles(context.user.id, tx);

      const tiles = data.map((d) => ({
        type: d.type,
        exerciseId: d.exerciseId,
        userId: context.user.id,
      }));

      await insertDashboardTiles(tiles, tx);
    });
  });
