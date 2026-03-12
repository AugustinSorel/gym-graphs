import { HttpApi } from "@effect/platform";
import { sessionApi } from "#/features/sessions/api";

export const Api = HttpApi.make("GymGraphsApi").add(sessionApi).prefix("/api");
