import { Effect, Option } from "effect";
import { Crypto } from "#/integrations/crypto/crypto";
import { AccountNotVerified } from "@gym-graphs/shared/auth/errors";
import { OAuthRepo } from "./repo";
import { ServerConfig } from "#/server-config";
import {
  GithubOauthTokenResponseSchema,
  type GithubCallbackUrlParams,
  type GithubSignInUrlParams,
} from "@gym-graphs/shared/oauth/schemas";
import { withTransaction } from "#/integrations/db/db";
import { UserRepo } from "../user/repo";
import { inferNameFromEmail } from "../user/utils";
import { SessionRepo } from "../session/repo";
import {
  createOAuthRequest,
  fetchGithubUser,
  fetchGithubUserEmail,
  sendTokenRequest,
} from "./utils";
import { Url } from "@effect/platform";
import { SeedUserService } from "../user/service";

export class OAuthService extends Effect.Service<OAuthService>()(
  "OAuthService",
  {
    accessors: true,
    dependencies: [
      OAuthRepo.Default,
      UserRepo.Default,
      SessionRepo.Default,
      Crypto.Default,
      SeedUserService.Default,
    ],
    effect: Effect.gen(function* () {
      const crypto = yield* Crypto;
      const oauthRepo = yield* OAuthRepo;
      const userRepo = yield* UserRepo;
      const sessionRepo = yield* SessionRepo;
      const serverConfig = yield* ServerConfig;

      const seedUserService = yield* SeedUserService;

      return {
        generateGithubOAuthUrl: (
          callbackUrl: (typeof GithubSignInUrlParams.Type)["callbackUrl"],
        ) => {
          return Effect.gen(function* () {
            const state = yield* crypto.generateOAuthState();
            const scope = ["user:email"] as const;

            const url = Url.mutate(
              new URL("https://github.com/login/oauth/authorize"),
              (u) => {
                u.searchParams.set("response_type", "code");
                u.searchParams.set("client_id", serverConfig.githubClient.id);
                u.searchParams.set("state", state);

                if (scope.length > 0) {
                  u.searchParams.set("scope", scope.join(" "));
                }

                if (callbackUrl) {
                  u.searchParams.set(
                    "redirect_uri",
                    `${serverConfig.url.api}/api/oauth/github/callback?redirect_uri=${callbackUrl}`,
                  );
                }
              },
            );

            return {
              url,
              state,
            };
          }).pipe(Effect.timeout(5000));
        },

        validateGithubCode: (
          code: (typeof GithubCallbackUrlParams.Type)["code"],
        ) => {
          return Effect.gen(function* () {
            const request = yield* createOAuthRequest(
              serverConfig.githubClient.id,
              serverConfig.githubClient.secret,
              code,
            );

            const tokens = yield* sendTokenRequest(request);

            return tokens;
          }).pipe(Effect.timeout(5000));
        },

        githubSignIn: (
          token: (typeof GithubOauthTokenResponseSchema.Type)["accessToken"],
        ) => {
          return Effect.gen(function* () {
            const githubUser = yield* fetchGithubUser(token);
            const githubUserEmail = yield* fetchGithubUserEmail(token);

            if (!githubUserEmail.verified) {
              return yield* Effect.fail(new AccountNotVerified());
            }

            return yield* withTransaction(
              Effect.gen(function* () {
                const userOption = yield* userRepo.findByEmail(
                  githubUserEmail.email,
                );

                const user = yield* Option.match(userOption, {
                  onNone: () => {
                    return Effect.gen(function* () {
                      const user = yield* userRepo.createWithEmail({
                        email: githubUserEmail.email,
                        name:
                          githubUser.name ??
                          inferNameFromEmail(githubUserEmail.email),
                      });

                      yield* oauthRepo.create({
                        providerId: "github",
                        providerUserId: githubUser.id.toString(),
                        userId: user.id,
                      });

                      yield* seedUserService.seed(user.id);

                      return user;
                    });
                  },
                  onSome: (user) => {
                    return Effect.gen(function* () {
                      yield* userRepo.updateVerifiedAtById(user.id);
                      return user;
                    });
                  },
                });

                const token = yield* crypto.generateId();

                const session = yield* sessionRepo.create({
                  id: yield* crypto.hashSHA256Hex(token),
                  userId: user.id,
                });

                return yield* Effect.succeed({
                  session,
                  token,
                });
              }),
            );
          }).pipe(Effect.timeout(5000));
        },
      };
    }),
  },
) {}
