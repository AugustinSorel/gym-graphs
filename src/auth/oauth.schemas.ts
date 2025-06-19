import { z } from "zod";

export const githubOAuthCallbackSchema = z
  .object({
    state: z.string(),
    candidateState: z.string(),
    code: z.string(),
    redirectUri: z.string().nullish(),
  })
  .refine((data) => data.state === data.candidateState, {
    message: "Github state don't match",
    path: ["state"],
  });

export type GithubOAuthCallback = Readonly<
  z.infer<typeof githubOAuthCallbackSchema>
>;

export const githubOAuthTokenResponseSchema = z
  .object({
    access_token: z.string().trim(),
    token_type: z.string().trim(),
  })
  .transform((tokens) => ({
    accessToken: tokens.access_token,
    tokenType: tokens.token_type,
  }));

export type GithubOAuthTokenResponse = Readonly<
  z.infer<typeof githubOAuthTokenResponseSchema>
>;

export const githubGetUserResponseSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  avatar_url: z.string(),
});

export const githubGetUserEmailResponseSchema = z.object({
  email: z.string(),
  primary: z.boolean(),
  verified: z.boolean(),
});
