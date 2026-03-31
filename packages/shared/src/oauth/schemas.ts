import { Schema } from "effect";

export const GithubState = Schema.Trim;

export const GithubSignInUrlParams = Schema.Struct({
  callbackUrl: Schema.optional(Schema.Trim),
});

export const GithubCallbackUrlParams = Schema.Struct({
  state: GithubState,
  code: Schema.Trim,
  redirectUrl: Schema.optional(Schema.Trim),
});

export const GithubOauthTokenResponseSchema = Schema.Struct({
  access_token: Schema.Trim,
  token_type: Schema.Trim,
}).pipe(
  Schema.rename({
    access_token: "accessToken",
    token_type: "tokenType",
  }),
);
