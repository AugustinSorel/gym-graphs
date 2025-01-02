import { createServerFn } from "@tanstack/start";
import { authGuard } from "../auth/auth.middlewares";
import { userSchema } from "./user.schemas";
import { renameUser } from "./user.services";
import { db } from "../utils/db";

export const renameUserAction = createServerFn({ method: "POST" })
  .middleware([authGuard])
  .validator(userSchema.pick({ name: true }))
  .handler(async ({ data, context }) => {
    await renameUser(data.name, context.user.id, db);
  });
