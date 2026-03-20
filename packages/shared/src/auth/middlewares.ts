import {
  HttpApiMiddleware,
  HttpApiSecurity,
  HttpApiError,
} from "@effect/platform";
import { Context, Schema } from "effect";
import { Unauthorized, AccountNotVerified } from "#/auth/errors";
import { CurrentSessionSchema } from "#/auth/schemas";

export const sessionSecurity = HttpApiSecurity.apiKey({
  in: "cookie",
  key: "session",
});

export class CurrentSession extends Context.Tag("CurrentSession")<
  CurrentSession,
  typeof CurrentSessionSchema.Type
>() {}

export class RequireSession extends HttpApiMiddleware.Tag<RequireSession>()(
  "Authorization",
  {
    failure: Schema.Union(
      Unauthorized,
      HttpApiError.RequestTimeout,
      HttpApiError.InternalServerError,
    ),
    provides: CurrentSession,
    security: {
      session: sessionSecurity,
    },
  },
) {}

export class RequireVerifiedSession extends HttpApiMiddleware.Tag<RequireVerifiedSession>()(
  "VerifiedAuthorization",
  {
    failure: Schema.Union(
      Unauthorized,
      AccountNotVerified,
      HttpApiError.RequestTimeout,
      HttpApiError.InternalServerError,
    ),
    provides: CurrentSession,
    security: {
      session: sessionSecurity,
    },
  },
) {}
