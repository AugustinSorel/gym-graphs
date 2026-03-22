import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";
import {
  GithubSignInUrlParams,
  GithubCallbackUrlParams,
  GithubState,
} from "#/oauth/schemas";
import { AccountNotVerified, Forbidden } from "#/auth/errors";
import {
  CreatingGithubOauthHttpBodyFailed,
  FailedToCommunicateWithGithub,
  GithubAccountHasNoPrimaryEmail,
  InvalidResponseFromGithub,
  ParsingGithubOauthStateFailed,
  ParsingGithubOauthTokensFailed,
  ParsingGithubOauthUserEmailsFailed,
  ParsingGithubOauthUserFailed,
} from "./errors";

export const oauthApi = HttpApiGroup.make("OAuth")
  .add(
    HttpApiEndpoint.get("githubSignIn", "/github/sign-in")
      .setUrlParams(GithubSignInUrlParams)
      .addSuccess(GithubState),
  )
  .add(
    HttpApiEndpoint.get("githubCallback", "/github/callback")
      .setUrlParams(GithubCallbackUrlParams)
      .addError(AccountNotVerified)
      .addError(Forbidden)
      .addError(ParsingGithubOauthStateFailed)
      .addError(ParsingGithubOauthTokensFailed)
      .addError(ParsingGithubOauthUserFailed)
      .addError(ParsingGithubOauthUserEmailsFailed)
      .addError(CreatingGithubOauthHttpBodyFailed)
      .addError(InvalidResponseFromGithub)
      .addError(GithubAccountHasNoPrimaryEmail)
      .addError(FailedToCommunicateWithGithub)
      .addSuccess(Schema.Void),
  )
  .prefix("/oauth");
