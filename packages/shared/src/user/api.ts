import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { PatchUserByIdPayload } from "./schemas";
import { CurrentSessionSchema } from "#/auth/schemas";
import { RequireVerifiedSession } from "#/auth/middlewares";

export const userApi = HttpApiGroup.make("User")
  .add(
    HttpApiEndpoint.patch("patchByUserId", "/me")
      .setPayload(PatchUserByIdPayload)
      .addSuccess(CurrentSessionSchema.fields.user),
  )
  .middleware(RequireVerifiedSession)
  .prefix("/users");
