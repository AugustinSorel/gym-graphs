import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { ServerConfig } from "#/env";
import { Data, Effect, Redacted } from "effect";

class EmailDeliveryError extends Data.TaggedError("EmailDeliveryError")<{
  readonly cause: unknown;
}> {}

export class Email extends Effect.Service<Email>()("Email", {
  accessors: true,
  effect: Effect.gen(function* () {
    const env = yield* ServerConfig;

    const email = new SESClient({
      region: env.smtp.host,
      credentials: {
        accessKeyId: env.smtp.user,
        secretAccessKey: Redacted.value(env.smtp.password),
      },
    });

    return {
      send: (to: Array<string>, subject: string, html: string) => {
        return Effect.gen(function* () {
          const config = new SendEmailCommand({
            Destination: { ToAddresses: to },
            Message: {
              Subject: { Data: subject },
              Body: { Html: { Data: html } },
            },
            Source: env.smtp.from,
          });

          const res = yield* Effect.tryPromise({
            try: () => email.send(config),
            catch: (e) => new EmailDeliveryError({ cause: e }),
          });

          return res;
        });
      },
    };
  }),
}) {}
