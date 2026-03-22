import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";

export class ParsingGithubOauthStateFailed extends Schema.TaggedError<ParsingGithubOauthStateFailed>()(
  "ParsingGithubOauthStateFailed",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Parsing github oauth state failed",
    }),
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class ParsingGithubOauthUserFailed extends Schema.TaggedError<ParsingGithubOauthUserFailed>()(
  "ParsingGithubOauthUserFailed",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Parsing github oauth user failed",
    }),
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class ParsingGithubOauthUserEmailsFailed extends Schema.TaggedError<ParsingGithubOauthUserEmailsFailed>()(
  "ParsingGithubOauthUserEmailsFailed",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Parsing github oauth user emails failed",
    }),
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class ParsingGithubOauthTokensFailed extends Schema.TaggedError<ParsingGithubOauthTokensFailed>()(
  "ParsingGithubOauthTokensFailed",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Parsing github oauth state failed",
    }),
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class CreatingGithubOauthHttpBodyFailed extends Schema.TaggedError<CreatingGithubOauthHttpBodyFailed>()(
  "CreatingGithubOauthHttpBodyFailed",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Create github oauth http body failed",
    }),
  },
  HttpApiSchema.annotations({ status: 400 }),
) {}

export class InvalidResponseFromGithub extends Schema.TaggedError<InvalidResponseFromGithub>()(
  "InvalidResponseFromGithub",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Invalid response from github",
    }),
  },
  HttpApiSchema.annotations({ status: 502 }),
) {}

export class FailedToCommunicateWithGithub extends Schema.TaggedError<FailedToCommunicateWithGithub>()(
  "FailedToCommunicateWithGithub",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Failed to communicate with github",
    }),
  },
  HttpApiSchema.annotations({ status: 502 }),
) {}

export class GithubAccountHasNoPrimaryEmail extends Schema.TaggedError<GithubAccountHasNoPrimaryEmail>()(
  "GithubAccountHasNoPrimaryEmail",
  {
    message: Schema.optionalWith(Schema.String, {
      default: () => "Github account has no primary email",
    }),
  },
  HttpApiSchema.annotations({ status: 403 }),
) {}
