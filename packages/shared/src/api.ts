import { HttpApi, HttpApiError } from "@effect/platform";
import { authApi } from "./auth/api";
import { oauthApi } from "./oauth/api";
import { userApi } from "./user/api";

export const Api = HttpApi.make("GymGraphsApi")
  .add(authApi)
  .add(oauthApi)
  .add(userApi)
  .addError(HttpApiError.InternalServerError)
  .addError(HttpApiError.RequestTimeout)
  .prefix("/api");
