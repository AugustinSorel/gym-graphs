import { env } from "~/env";
import {
  createOAuthRequest,
  encodeBasicOAuthCredentials,
  fetchGithubUser,
  fetchGithubUserEmail,
  sendTokenRequest,
} from "~/domains/oauth/oauth.utils";
import { userRepo } from "@gym-graphs/db/repo/user";
import { seedUserAccount } from "~/domains/user/user.seed";
import { inferNameFromEmail } from "~/domains/user/user.utils";
import { oauthRepo } from "@gym-graphs/db/repo/oauth";
import { generateSessionToken } from "~/domains/session/session.utils";
import { sessionRepo } from "@gym-graphs/db/repo/session";
import { dbErrorToHttp } from "~/libs/db";
import type { Db } from "@gym-graphs/db";
import type {
  GithubOAuthCallbackQuery,
  GithubOAuthTokenResponse,
} from "@gym-graphs/schemas/oauth";

const validateGithubOAuthCode = async (
  code: GithubOAuthCallbackQuery["code"],
) => {
  const body = new URLSearchParams();

  body.set("grant_type", "authorization_code");
  body.set("code", code);

  const request = createOAuthRequest(
    "https://github.com/login/oauth/access_token",
    body,
  );

  const encodedCredentials = encodeBasicOAuthCredentials(
    env.GITHUB_CLIENT_ID,
    env.GITHUB_CLIENT_SECRET,
  );

  request.headers.set("Authorization", `Basic ${encodedCredentials}`);

  const tokens = await sendTokenRequest(request);

  return tokens;
};

const githubSignIn = async (
  token: GithubOAuthTokenResponse["accessToken"],
  db: Db,
) => {
  const [githubUser, githubUserEmail] = await Promise.all([
    fetchGithubUser(token),
    fetchGithubUserEmail(token),
  ]);

  if (!githubUserEmail.verified) {
    throw new Error("Github account not verified");
  }

  return db.transaction(async (tx) => {
    const existingUser = await userRepo
      .selectByEmail(githubUserEmail.email, tx)
      .match((user) => user, dbErrorToHttp);

    if (existingUser) {
      const user = await userRepo
        .updateEmailVerifiedAt(existingUser.id, tx)
        .match((user) => user, dbErrorToHttp);

      const token = generateSessionToken();
      const session = await sessionRepo
        .create(token, user.id, tx)
        .match((session) => session, dbErrorToHttp);

      return {
        session,
        token,
      };
    }

    const user = await userRepo
      .createWithEmail(
        githubUserEmail.email,
        githubUser.name ?? inferNameFromEmail(githubUserEmail.email),
        db,
      )
      .match((user) => user, dbErrorToHttp);

    await oauthRepo
      .create("github", githubUser.id.toString(), user.id, tx)
      .match((oauth) => oauth, dbErrorToHttp);

    await seedUserAccount(user.id, tx);

    const token = generateSessionToken();
    const session = await sessionRepo
      .create(token, user.id, tx)
      .match((session) => session, dbErrorToHttp);

    return {
      session,
      token,
    };
  });
};

export const oauthService = {
  validateGithubOAuthCode,
  githubSignIn,
};
