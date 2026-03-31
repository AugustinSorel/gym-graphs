import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import {
  CreatingGithubOauthHttpBodyFailed,
  FailedToCommunicateWithGithub,
  GithubAccountHasNoPrimaryEmail,
  InvalidResponseFromGithub,
  ParsingGithubOauthTokensFailed,
  ParsingGithubOauthUserEmailsFailed,
  ParsingGithubOauthUserFailed,
} from "@gym-graphs/shared/oauth/errors";
import { GithubOauthTokenResponseSchema } from "@gym-graphs/shared/oauth/schemas";
import { Array, Effect, Redacted, Schema } from "effect";

//FIX: this should be agnostic to providers
export const createOAuthRequest = (
  clientId: string,
  clientSecret: Redacted.Redacted<string>,
  code: string,
) => {
  const endpoint = "https://github.com/login/oauth/access_token";

  const payload = {
    client_id: clientId,
    client_secret: Redacted.value(clientSecret),
    code: code,
  };

  return HttpClientRequest.post(endpoint).pipe(
    HttpClientRequest.acceptJson,
    HttpClientRequest.setHeader("User-Agent", "Gym-Graphs app"),
    HttpClientRequest.bodyJson(payload),
    Effect.mapError(() => new CreatingGithubOauthHttpBodyFailed()),
  );
};

export const encodeBasicOAuthCredentials = (
  username: string,
  password: Redacted.Redacted<string>,
) => {
  return Effect.sync(() => {
    const credentials = `${username}:${Redacted.value(password)}`;

    return Buffer.from(credentials, "utf-8").toString("base64");
  });
};

//FIX: this should be agnostic to providers
export const sendTokenRequest = (
  request: HttpClientRequest.HttpClientRequest,
) => {
  return Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;

    return yield* client
      .pipe(HttpClient.filterStatusOk)
      .execute(request)
      .pipe(
        Effect.flatMap(
          HttpClientResponse.schemaBodyJson(GithubOauthTokenResponseSchema),
        ),
        Effect.catchTags({
          ParseError: () => new ParsingGithubOauthTokensFailed(),
          RequestError: () => new FailedToCommunicateWithGithub(),
          ResponseError: () => new InvalidResponseFromGithub(),
        }),
      );
  });
};

export const fetchGithubUser = (
  token: (typeof GithubOauthTokenResponseSchema.Type)["accessToken"],
) => {
  return Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;

    const request = HttpClientRequest.get("https://api.github.com/user").pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.setHeader("User-Agent", "Gym-Graphs app"),
    );

    const ResSchema = Schema.Struct({
      id: Schema.Number,
      name: Schema.NullishOr(Schema.String),
      avatar_url: Schema.Trim,
    }).pipe(
      Schema.rename({
        avatar_url: "avatarUrl",
      }),
    );

    return yield* client
      .pipe(HttpClient.filterStatusOk)
      .execute(request)
      .pipe(
        Effect.flatMap(HttpClientResponse.schemaBodyJson(ResSchema)),
        Effect.catchTags({
          ParseError: () => new ParsingGithubOauthUserFailed(),
          RequestError: () => new FailedToCommunicateWithGithub(),
          ResponseError: () => new InvalidResponseFromGithub(),
        }),
      );
  });
};

export const fetchGithubUserEmail = (
  token: (typeof GithubOauthTokenResponseSchema.Type)["accessToken"],
) => {
  return Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;

    const request = HttpClientRequest.get(
      "https://api.github.com/user/emails",
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.setHeader("User-Agent", "Gym-Graphs app"),
      HttpClientRequest.acceptJson,
    );

    const ResSchema = Schema.Struct({
      email: Schema.Trim,
      primary: Schema.Boolean,
      verified: Schema.Boolean,
    }).pipe(Schema.Array);

    const emails = yield* client
      .pipe(HttpClient.filterStatusOk)
      .execute(request)
      .pipe(
        Effect.flatMap(HttpClientResponse.schemaBodyJson(ResSchema)),
        Effect.catchTags({
          ParseError: () => new ParsingGithubOauthUserEmailsFailed(),
          RequestError: () => new FailedToCommunicateWithGithub(),
          ResponseError: () => new InvalidResponseFromGithub(),
        }),
      );

    return yield* Array.findFirst(emails, (email) => email.primary).pipe(
      Effect.mapError(() => new GithubAccountHasNoPrimaryEmail()),
    );
  });
};
