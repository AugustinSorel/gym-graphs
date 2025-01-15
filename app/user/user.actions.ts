import { createServerFn } from "@tanstack/start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { userSchema } from "~/user/user.schemas";
import {
  deleteUser,
  renameUser,
  selectClientUser,
  updateWeightUnit,
} from "~/user/user.services";
import { db } from "~/utils/db";
import { deleteSessionTokenCookie } from "~/cookie/cookie.services";
import { setResponseStatus } from "vinxi/http";

export const getUserAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware])
  .handler(async ({ context }) => {
    const user = await selectClientUser(context.session.userId, db);

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
    await renameUser(data.name, context.session.userId, db);
  });

export const deleteAccountAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware])
  .handler(async ({ context }) => {
    await deleteUser(context.session.userId, db);
    deleteSessionTokenCookie();
  });

export const updateWeightUnitAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware])
  .validator(userSchema.pick({ weightUnit: true }))
  .handler(async ({ context, data }) => {
    await updateWeightUnit(data.weightUnit, context.session.userId, db);
  });
