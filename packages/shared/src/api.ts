import { HttpApi, HttpApiError } from "@effect/platform";
import { authApi } from "./auth/api";
import { oauthApi } from "./oauth/api";

export const Api = HttpApi.make("GymGraphsApi")
  .add(authApi)
  .add(oauthApi)
  .addError(HttpApiError.InternalServerError)
  .addError(HttpApiError.RequestTimeout)
  .prefix("/api");
