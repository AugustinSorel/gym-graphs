import { HttpApi, HttpApiError } from "@effect/platform";
import { authApi } from "./auth/api";
import { oauthApi } from "./oauth/api";
import { userApi } from "./user/api";
import { tagApi } from "./tag/api";

export const Api = HttpApi.make("GymGraphsApi")
  .add(authApi)
  .add(oauthApi)
  .add(userApi)
  .add(tagApi)
  .addError(HttpApiError.InternalServerError)
  .addError(HttpApiError.RequestTimeout)
  .prefix("/api");
