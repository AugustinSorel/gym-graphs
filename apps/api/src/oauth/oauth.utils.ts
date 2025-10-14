import {
  githubGetUserEmailResponseSchema,
  githubGetUserResponseSchema,
  githubOAuthTokenResponseSchema,
  type GithubOAuthCallbackQuery,
  type GithubOAuthTokenResponse,
} from "@gym-graphs/schemas/oauth";
import { randomBytes } from "crypto";
import { env } from "~/env";

export const generateOAuthState = () => {
  return randomBytes(64).toString("hex").normalize();
};

type OAuthState = ReturnType<typeof generateOAuthState>;

export const generateGithubOAuthUrl = (
  state: OAuthState,
  scope: ReadonlyArray<string>,
  redirectUri: GithubOAuthCallbackQuery["redirectUri"],
) => {
  const url = new URL("https://github.com/login/oauth/authorize");

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  url.searchParams.set("state", state);

  if (scope?.length) {
    url.searchParams.set("scope", scope.join(" "));
  }

  if (redirectUri) {
    //FIX:
    const appUrl = "http://localhost:5000";

    url.searchParams.set(
      "redirect_uri",
      `${appUrl}/api/oauth/github/callback?redirect_uri=${redirectUri}`,
    );
  }

  return url;
};

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

export const encodeBasicOAuthCredentials = (
  username: string,
  password: string,
) => {
  const credentials = `${username}:${password}`;

  return Buffer.from(credentials, "utf-8").toString("base64");
};

export const sendTokenRequest = async (request: Request) => {
  const response = await fetch(request);

  if (!response.ok) {
    throw new Error("sending oauth tokens failed");
  }

  return githubOAuthTokenResponseSchema.parse(await response.json());
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
