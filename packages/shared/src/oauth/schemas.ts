import { pipe, Schema } from "effect";
import { UserSchema } from "#/user/schemas";

export const GithubState = pipe(
  Schema.Trim.annotations({ message: () => "state must be a valid string" }),
  Schema.nonEmptyString({ message: () => "state is required" }),
);

export const GithubSignInUrlParams = Schema.Struct({
  callbackUrl: Schema.optional(
    pipe(
      Schema.Trim.annotations({ message: () => "callbackUrl must be a valid string" }),
      Schema.nonEmptyString({ message: () => "callbackUrl must not be empty" }),
    ),
  ),
});

export const GithubCallbackUrlParams = Schema.Struct({
  state: GithubState,
  code: pipe(
    Schema.Trim.annotations({ message: () => "code must be a valid string" }),
    Schema.nonEmptyString({ message: () => "code is required" }),
  ),
  redirectUrl: Schema.optional(
    pipe(
      Schema.Trim.annotations({ message: () => "redirectUrl must be a valid string" }),
      Schema.nonEmptyString({ message: () => "redirectUrl must not be empty" }),
    ),
  ),
});

export const GithubOauthTokenResponseSchema = Schema.Struct({
  access_token: pipe(
    Schema.Trim.annotations({ message: () => "access_token must be a valid string" }),
    Schema.nonEmptyString({ message: () => "access_token is required" }),
  ),
  token_type: pipe(
    Schema.Trim.annotations({ message: () => "token_type must be a valid string" }),
    Schema.nonEmptyString({ message: () => "token_type is required" }),
  ),
}).pipe(
  Schema.rename({
    access_token: "accessToken",
    token_type: "tokenType",
  }),
);

export const OAuthAccountSchema = Schema.Struct({
  providerId: Schema.Literal("github").annotations({
    message: () => 'providerId must be "github"',
  }),
  providerUserId: pipe(
    Schema.String.annotations({ message: () => "providerUserId must be a string" }),
    Schema.nonEmptyString({ message: () => "providerUserId is required" }),
  ),
  userId: UserSchema.fields.id,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export type OAuthAccount = typeof OAuthAccountSchema.Type;
