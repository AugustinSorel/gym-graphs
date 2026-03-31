import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { PatchUserByIdPayload, UserDataExportSchema } from "./schemas";
import { CurrentSessionSchema } from "#/auth/schemas";
import { RequireVerifiedSession } from "#/auth/middlewares";
import { UserNotFound } from "./errors";

export const userApi = HttpApiGroup.make("User")
  .add(
    HttpApiEndpoint.patch("patch", "/me")
      .setPayload(PatchUserByIdPayload)
      .addSuccess(CurrentSessionSchema.fields.user),
  )
  .add(HttpApiEndpoint.del("delete", "/me"))
  .add(
    HttpApiEndpoint.get("exportData", "/me/data")
      .addSuccess(UserDataExportSchema)
      .addError(UserNotFound),
  )
  .middleware(RequireVerifiedSession)
  .prefix("/users");
