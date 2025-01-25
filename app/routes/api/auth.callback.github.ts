import { createAPIFileRoute } from "@tanstack/start/api";
import { getCookie } from "vinxi/http";
import { z } from "zod";
import { setSessionTokenCookie } from "~/auth/auth.cookies";
import {
  createOauthAccount,
  createSession,
  fetchGithubUser,
  fetchGithubUserEmail,
  generateSessionToken,
  GithubOauthToken,
} from "~/auth/auth.services";
import { db } from "~/libs/db.lib";
import { github } from "~/libs/github.lib";
import {
  createUserWithEmailOnly,
  seedUserAccount,
  selectUserByEmail,
  updateEmailVerifiedAt,
} from "~/user/user.services";

export const APIRoute = createAPIFileRoute("/api/auth/callback/github")({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);

      const { code } = githubOauthSchema.parse({
        state: url.searchParams.get("state"),
        code: url.searchParams.get("code"),
        callbackUrl: url.searchParams.get("callback-url"),
        candidateState: getCookie("github_oauth_state"),
      });

      const tokens = await github.validateAuthorizationCode(code);

      const user = await githubSignIn(tokens.accessToken());

      const sessionToken = generateSessionToken();

      const session = await createSession(sessionToken, user.id, db);

      setSessionTokenCookie(sessionToken, session.expiresAt);

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/dashboard",
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

const githubOauthSchema = z
  .object({
    state: z.string(),
    candidateState: z.string(),
    code: z.string(),
    callbackUrl: z.string().nullish(),
  })
  .refine((data) => data.state === data.candidateState, {
    message: "Github state don't match",
    path: ["state"],
  });

const githubSignIn = async (token: GithubOauthToken) => {
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
    githubUser.name ?? githubUserEmail.email.split("@").at(0) ?? "?",
    db,
  );

  await createOauthAccount("github", githubUser.id.toString(), user.id, db);

  await seedUserAccount(user.id, db);

  return user;
};
