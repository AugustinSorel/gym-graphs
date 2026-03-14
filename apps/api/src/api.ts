import { HttpApi, HttpApiError } from "@effect/platform";
import { authApi } from "#/features/auth/api";

export const Api = HttpApi.make("GymGraphsApi")
  .add(authApi)
  .addError(HttpApiError.InternalServerError)
  .addError(HttpApiError.RequestTimeout)
  .prefix("/api");
