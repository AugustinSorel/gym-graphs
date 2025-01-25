import { getEvent, setCookie } from "vinxi/http";
import { env } from "~/env";
import type { GithubOauthToken, SessionToken } from "~/auth/auth.services";

export const setSessionTokenCookie = (
  sessionToken: SessionToken,
  expiresAt: Date,
) => {
  const event = getEvent();

  setCookie(event, "session", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
};

export const setGithubTokenCookie = (token: GithubOauthToken) => {
  const event = getEvent();

  setCookie(event, "github_oauth_state", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
};

export const deleteSessionTokenCookie = () => {
  const event = getEvent();

  setCookie(event, "session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
};
