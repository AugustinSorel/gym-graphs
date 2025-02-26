import { randomBytes } from "crypto";
import { env } from "~/env";
import { oauthAccountTable } from "~/db/db.schemas";
import {
  githubGetUserEmailResponseSchema,
  githubGetUserResponseSchema,
  githubOAuthTokenResponseSchema,
} from "~/auth/oauth.schemas";
import type { OAuthAccount } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type {
  GithubOAuthCallback,
  GithubOAuthTokenResponse,
} from "~/auth/oauth.schemas";

export const generateOAuthState = () => {
  return randomBytes(64).toString("hex").normalize();
};

export type OAuthState = ReturnType<typeof generateOAuthState>;

export const createOAuthRequest = (endpoint: string, body: URLSearchParams) => {
  const bodyBytes = new TextEncoder().encode(body.toString());

  const request = new Request(endpoint, {
    method: "POST",
    body: bodyBytes,
  });

  request.headers.set("Content-Type", "application/x-www-form-urlencoded");
  request.headers.set("Accept", "application/json");
  request.headers.set("User-Agent", "Gym-Graphs app");
  request.headers.set("Content-Length", bodyBytes.byteLength.toString());

  return request;
};

export const generateGithubOAuthUrl = (
  state: OAuthState,
  scopes: ReadonlyArray<string>,
  redirectUri: GithubOAuthCallback["redirectUri"],
) => {
  const url = new URL("https://github.com/login/oauth/authorize");

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  url.searchParams.set("state", state);

  if (scopes?.length) {
    url.searchParams.set("scopes", scopes.join(" "));
  }

  if (redirectUri) {
    url.searchParams.set(
      "redirect_uri",
      `${env.APP_URL}/api/auth/callback/github?redirect_uri=${redirectUri}`,
    );
  }

  return url;
};

export const validateGithubOAuthCode = async (
  code: GithubOAuthCallback["code"],
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

const sendTokenRequest = async (request: Request) => {
  const response = await fetch(request);

  if (!response.ok) {
    throw new Error("sending oauth tokens failed");
  }

  return githubOAuthTokenResponseSchema.parse(await response.json());
};

const encodeBasicOAuthCredentials = (username: string, password: string) => {
  const credentials = `${username}:${password}`;

  return Buffer.from(credentials, "utf-8").toString("base64");
};

export const fetchGithubUser = async (
  token: GithubOAuthTokenResponse["accessToken"],
) => {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Gym-Graphs app",
    },
  });

  if (!res.ok) {
    throw new Error("could not fetch github user");
  }

  const candidateUser = await res.json();

  return githubGetUserResponseSchema.parse(candidateUser);
};

export const fetchGithubUserEmail = async (
  token: GithubOAuthTokenResponse["accessToken"],
) => {
  const res = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Gym-Graphs app",
    },
  });

  if (!res.ok) {
    throw new Error("could not fetch github user email");
  }

  const candidateEmails = await res.json();

  const emails = githubGetUserEmailResponseSchema
    .array()
    .parse(candidateEmails);

  const primaryEmail = emails.find((email) => email.primary) ?? null;

  if (!primaryEmail) {
    throw new Error("could not fetch github user email");
  }

  return primaryEmail;
};

export const createOAuthAccount = async (
  providerId: OAuthAccount["providerId"],
  providerUserId: OAuthAccount["providerUserId"],
  userId: OAuthAccount["userId"],
  db: Db,
) => {
  await db.insert(oauthAccountTable).values({
    providerId,
    providerUserId,
    userId,
  });
};
