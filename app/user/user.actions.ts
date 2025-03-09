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
import { AppError, tryCatch } from "~/libs/error";
import { UserNotFoundError } from "~/user/user.errors";

export const selectUserAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    const user = await tryCatch(selectClientUser(context.user.id, context.db));

    if (user.error) {
      const code = user.error instanceof AppError ? user.error.statusCode : 500;
      setResponseStatus(code);
      throw user.error;
    }

    if (!user.data) {
      const error = new UserNotFoundError();
      setResponseStatus(error.statusCode);
      throw error;
    }

    return user.data;
  });

export const renameUserAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ name: true }))
  .handler(async ({ data, context }) => {
    const user = await tryCatch(
      renameUser(data.name, context.user.id, context.db),
    );

    if (user.error) {
      const code = user.error instanceof AppError ? user.error.statusCode : 500;
      setResponseStatus(code);
      throw user.error;
    }
  });

export const deleteAccountAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    const user = await tryCatch(deleteUser(context.user.id, context.db));

    if (user.error) {
      const statusCode =
        user.error instanceof AppError ? user.error.statusCode : 500;
      setResponseStatus(statusCode);
      throw user.error;
    }

    deleteSessionTokenCookie();
  });

export const updateWeightUnitAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ weightUnit: true }))
  .handler(async ({ context, data }) => {
    const user = await tryCatch(
      updateWeightUnit(data.weightUnit, context.user.id, context.db),
    );

    if (user.error) {
      const code = user.error instanceof AppError ? user.error.statusCode : 500;
      setResponseStatus(code);
      throw user.error;
    }
  });

export const updateOneRepMaxAlgoAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(userSchema.pick({ oneRepMaxAlgo: true }))
  .handler(async ({ context, data }) => {
    const user = await tryCatch(
      updateOneRepMaxAlgo(data.oneRepMaxAlgo, context.user.id, context.db),
    );

    if (user.error) {
      const code = user.error instanceof AppError ? user.error.statusCode : 500;
      setResponseStatus(code);
      throw user.error;
    }
  });

export const selectUserDataAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    const user = await tryCatch(selectUserData(context.user.id, context.db));

    if (user.error) {
      const code = user.error instanceof AppError ? user.error.statusCode : 500;
      setResponseStatus(code);
      throw user.error;
    }

    if (!user.data) {
      const error = new UserNotFoundError();
      setResponseStatus(error.statusCode);
      throw error;
    }

    return user.data;
  });
