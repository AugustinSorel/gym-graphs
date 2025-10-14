import { z } from "zod";

export const githubOAuthCallbackQuerySchema = z.object({
  state: z.string(),
  code: z.string(),
  redirectUri: z.string().nullish(),
});

export type GithubOAuthCallbackQuery = Readonly<
  z.infer<typeof githubOAuthCallbackQuerySchema>
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
