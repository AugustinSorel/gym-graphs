import { createServerFn } from "@tanstack/react-start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { userSchema } from "~/user/user.schemas";
import {
  deleteUser,
  renameUser,
  selectClientUser,
  selectUserData,
  updateDashboardView,
  updateOneRepMaxAlgo,
  updateWeightUnit,
} from "~/user/user.services";
import { deleteSessionTokenCookie } from "~/auth/auth.cookies";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { UserNotFoundError } from "~/user/user.errors";

export const selectUserAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    const user = await selectClientUser(context.user.id, context.db);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  });

export const renameUserAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .inputValidator(userSchema.pick({ name: true }))
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
  .inputValidator(userSchema.pick({ weightUnit: true }))
  .handler(async ({ context, data }) => {
    await updateWeightUnit(data.weightUnit, context.user.id, context.db);
  });

export const updateOneRepMaxAlgoAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .inputValidator(userSchema.pick({ oneRepMaxAlgo: true }))
  .handler(async ({ context, data }) => {
    await updateOneRepMaxAlgo(data.oneRepMaxAlgo, context.user.id, context.db);
  });

export const selectUserDataAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    const user = await selectUserData(context.user.id, context.db);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  });

export const updateDashboardViewAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .inputValidator(userSchema.pick({ dashboardView: true }))
  .handler(async ({ context, data }) => {
    return updateDashboardView(context.user.id, data.dashboardView, context.db);
  });
