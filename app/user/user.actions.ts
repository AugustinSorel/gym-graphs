import { createServerFn } from "@tanstack/start";
import { authGuard } from "../auth/auth.middlewares";
import { userSchema } from "./user.schemas";
import { deleteUser, renameUser, updateWeightUnit } from "./user.services";
import { db } from "../utils/db";
import { deleteSessionTokenCookie } from "../cookie/cookie.services";

export const renameUserAction = createServerFn({ method: "POST" })
  .middleware([authGuard])
  .validator(userSchema.pick({ name: true }))
  .handler(async ({ data, context }) => {
    await renameUser(data.name, context.user.id, db);
  });

export const deleteAccountAction = createServerFn({ method: "POST" })
  .middleware([authGuard])
  .handler(async ({ context }) => {
    await deleteUser(context.user.id, db);
    deleteSessionTokenCookie();
  });

export const updateWeightUnitAction = createServerFn({ method: "POST" })
  .middleware([authGuard])
  .validator(userSchema.pick({ weightUnit: true }))
  .handler(async ({ context, data }) => {
    await updateWeightUnit(data.weightUnit, context.user.id, db);
  });
