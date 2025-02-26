import { getEvent, setCookie } from "vinxi/http";
import { env } from "~/env";
import type { SessionToken } from "~/auth/auth.services";
import type { OAuthState } from "~/auth/oauth.services";

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

export const setGithubStateCookie = (state: OAuthState) => {
  const event = getEvent();

  setCookie(event, "github_oauth_state", state, {
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
