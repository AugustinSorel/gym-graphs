import { createServerFn } from "@tanstack/start";
import {
  authGuardMiddleware,
  rateLimiterMiddleware,
} from "~/auth/auth.middlewares";
import { userSchema } from "~/user/user.schemas";
import {
  deleteUser,
  renameUser,
  selectClientUser,
  updateOneRepMaxAlgo,
  updateWeightUnit,
} from "~/user/user.services";
import { deleteSessionTokenCookie } from "~/auth/auth.cookies";
import { setResponseStatus } from "vinxi/http";
import { injectDbMiddleware } from "~/db/db.middlewares";

export const selectUserAction = createServerFn({ method: "GET" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    const user = await selectClientUser(context.user.id, context.db);

    if (!user) {
      setResponseStatus(404);
      throw new Error("user not found");
    }

    return user;
  });

export const renameUserAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ name: true }))
  .handler(async ({ data, context }) => {
    await renameUser(data.name, context.user.id, context.db);
  });

export const deleteAccountAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    await deleteUser(context.user.id, context.db);
    deleteSessionTokenCookie();
  });

export const updateWeightUnitAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ weightUnit: true }))
  .handler(async ({ context, data }) => {
    await updateWeightUnit(data.weightUnit, context.user.id, context.db);
  });

export const updateOneRepMaxAlgoAction = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ oneRepMaxAlgo: true }))
  .handler(async ({ context, data }) => {
    await updateOneRepMaxAlgo(data.oneRepMaxAlgo, context.user.id, context.db);
  });
