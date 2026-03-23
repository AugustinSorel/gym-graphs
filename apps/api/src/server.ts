import { Effect, Layer } from "effect";
import { ServerConfig } from "./server-config";
import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpServer,
  HttpMiddleware,
  FetchHttpClient,
} from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { createServer } from "node:http";
import { AuthLive } from "#/features/auth/handlers";
import { Api } from "@gym-graphs/shared/api";
import { Database } from "#/integrations/db/db";
import { AuthCookies } from "./features/auth/cookies";
import { AuthService } from "./features/auth/service";
import {
  RequireSessionLive,
  RequireVerifiedSessionLive,
} from "./features/auth/security";
import { SessionService } from "./features/session/service";
import { Email } from "./integrations/email/client";
import { VerificationCodeService } from "./features/verification-code/service";
import { OAuthService } from "./features/oauth/service";
import { OAuthLive } from "./features/oauth/handlers";
import { UserLive } from "./features/user/handler";
import { TagLive } from "./features/tag/handler";
import { UserService } from "./features/user/service";
import { TagService } from "./features/tag/service";

const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(AuthLive),
  Layer.provide(OAuthLive),
  Layer.provide(UserLive),
  Layer.provide(TagLive),
);

const HttpServerLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* ServerConfig;
    return NodeHttpServer.layer(createServer, { port: config.port });
  }),
);

const CorsLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* ServerConfig;
    return HttpApiBuilder.middlewareCors({
      credentials: true,
      allowedOrigins: [config.url.web],
    });
  }),
);

export const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  HttpServer.withLogAddress,
  Layer.provide(CorsLive),
  Layer.provide(HttpApiSwagger.layer({ path: "/doc" })),
  Layer.provide(ApiLive),
  Layer.provide(RequireSessionLive),
  Layer.provide(RequireVerifiedSessionLive),
  Layer.provide(SessionService.Default),
  Layer.provide(AuthService.Default),
  Layer.provide(OAuthService.Default),
  Layer.provide(UserService.Default),
  Layer.provide(TagService.Default),
  Layer.provide(AuthCookies.Default),
  Layer.provide(VerificationCodeService.Default),
  Layer.provide(Email.Default),
  Layer.provide(Database.Default),
  Layer.provide(HttpServerLive),
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(ServerConfig.Default),
);
