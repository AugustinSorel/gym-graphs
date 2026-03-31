import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { ServerConfig } from "#/server-config";
import { Data, Effect, Redacted } from "effect";

class EmailDeliveryError extends Data.TaggedError("EmailDeliveryError")<{
  readonly cause: unknown;
}> {}

export class Email extends Effect.Service<Email>()("Email", {
  accessors: true,
  effect: Effect.gen(function* () {
    const config = yield* ServerConfig;

    const email = new SESClient({
      region: config.smtp.host,
      credentials: {
        accessKeyId: config.smtp.user,
        secretAccessKey: Redacted.value(config.smtp.password),
      },
    });

    return {
      send: (to: Array<string>, subject: string, html: string) => {
        return Effect.gen(function* () {
          const sendCmd = new SendEmailCommand({
            Destination: { ToAddresses: to },
            Message: {
              Subject: { Data: subject },
              Body: { Html: { Data: html } },
            },
            Source: config.smtp.from,
          });

          const res = yield* Effect.tryPromise({
            try: () => email.send(sendCmd),
            catch: (e) => new EmailDeliveryError({ cause: e }),
          });

          return res;
        });
      },
    };
  }),
}) {}
