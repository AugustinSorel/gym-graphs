import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { PatchUserByIdPayload } from "./schemas";
import { CurrentSessionSchema } from "#/auth/schemas";
import { RequireVerifiedSession } from "#/auth/middlewares";

export const userApi = HttpApiGroup.make("User")
  .add(
    HttpApiEndpoint.patch("patch", "/me")
      .setPayload(PatchUserByIdPayload)
      .addSuccess(CurrentSessionSchema.fields.user),
  )
  .add(HttpApiEndpoint.del("delete", "/me"))
  .middleware(RequireVerifiedSession)
  .prefix("/users");
