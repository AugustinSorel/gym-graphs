import { createServerFn } from "@tanstack/react-start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { userSchema } from "~/user/user.schemas";
import {
  deleteUser,
  renameUser,
  selectClientUser,
  selectUserData,
  updateOneRepMaxAlgo,
  updateWeightUnit,
} from "~/user/user.services";
import { deleteSessionTokenCookie } from "~/auth/auth.cookies";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { setResponseStatus } from "@tanstack/react-start/server";
import { AppError } from "~/libs/error";
import { UserNotFoundError } from "~/user/user.errors";

export const selectUserAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    try {
      const user = await selectClientUser(context.user.id, context.db);

      if (!user) {
        throw new UserNotFoundError();
      }

      return user;
    } catch (e) {
      const code = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(code);
      throw e;
    }
  });

export const renameUserAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ name: true }))
  .handler(async ({ data, context }) => {
    try {
      await renameUser(data.name, context.user.id, context.db);
    } catch (e) {
      const code = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(code);
      throw e;
    }
  });

export const deleteAccountAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    try {
      await deleteUser(context.user.id, context.db);
      deleteSessionTokenCookie();
    } catch (e) {
      const statusCode = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(statusCode);
      throw e;
    }
  });

export const updateWeightUnitAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ weightUnit: true }))
  .handler(async ({ context, data }) => {
    try {
      await updateWeightUnit(data.weightUnit, context.user.id, context.db);
    } catch (e) {
      const code = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(code);
      throw e;
    }
  });

export const updateOneRepMaxAlgoAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ oneRepMaxAlgo: true }))
  .handler(async ({ context, data }) => {
    try {
      await updateOneRepMaxAlgo(
        data.oneRepMaxAlgo,
        context.user.id,
        context.db,
      );
    } catch (e) {
      const code = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(code);
      throw e;
    }
  });

export const selectUserDataAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    try {
      const user = await selectUserData(context.user.id, context.db);

      if (!user) {
        throw new UserNotFoundError();
      }

      return user;
    } catch (e) {
      const code = e instanceof AppError ? e.statusCode : 500;
      setResponseStatus(code);
      throw e;
    }
  });
