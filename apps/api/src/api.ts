import { HttpApi } from "@effect/platform";
import { authApi } from "#/features/auth/api";

export const Api = HttpApi.make("GymGraphsApi").add(authApi).prefix("/api");
