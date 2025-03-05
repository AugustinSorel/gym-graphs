import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getCookie } from "vinxi/http";
import { setSessionTokenCookie } from "~/auth/auth.cookies";
import { createSession, generateSessionToken } from "~/auth/auth.services";
import { db } from "~/libs/db";
import {
  createUserWithEmailOnly,
  seedUserAccount,
  selectUserByEmail,
  updateEmailVerifiedAt,
} from "~/user/user.services";
import { inferNameFromEmail } from "~/user/user.utils";
import {
  createOAuthAccount,
  fetchGithubUser,
  fetchGithubUserEmail,
  validateGithubOAuthCode,
} from "~/auth/oauth.services";
import { githubOAuthCallbackSchema } from "~/auth/oauth.schemas";
import type { GithubOAuthTokenResponse } from "~/auth/oauth.schemas";

export const APIRoute = createAPIFileRoute("/api/auth/callback/github")({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);

      const { code, redirectUri } = githubOAuthCallbackSchema.parse({
        state: url.searchParams.get("state"),
        code: url.searchParams.get("code"),
        redirectUri: url.searchParams.get("redirect_uri"),
        candidateState: getCookie("github_oauth_state"),
      });

      const tokens = await validateGithubOAuthCode(code);

      const user = await githubSignIn(tokens.accessToken);

      const sessionToken = generateSessionToken();

      const session = await createSession(sessionToken, user.id, db);

      setSessionTokenCookie(sessionToken, session.expiresAt);

      return new Response(null, {
        status: 302,
        headers: {
          Location: redirectUri ? redirectUri : "/dashboard",
        },
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "something went wrong";

      return new Response(null, {
        status: 302,
        headers: {
          Location: `/sign-up?error=${encodeURIComponent(errorMsg)}`,
        },
      });
    }
  },
});

const githubSignIn = async (token: GithubOAuthTokenResponse["accessToken"]) => {
  const [githubUser, githubUserEmail] = await Promise.all([
    fetchGithubUser(token),
    fetchGithubUserEmail(token),
  ]);

  if (!githubUserEmail.verified) {
    throw new Error("Github account not verified");
  }

  const existingUser = await selectUserByEmail(githubUserEmail.email, db);

  if (existingUser) {
    const user = await updateEmailVerifiedAt(existingUser.id, db);

    return user;
  }

  const user = await createUserWithEmailOnly(
    githubUserEmail.email,
    githubUser.name ?? inferNameFromEmail(githubUserEmail.email),
    db,
  );

  await createOAuthAccount("github", githubUser.id.toString(), user.id, db);

  await seedUserAccount(user.id, db);

  return user;
};
