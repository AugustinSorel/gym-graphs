import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { createMiddleware } from "hono/factory";
import { env } from "~/env";
import type { Ctx } from "~/index";

const buildConfig = (to: Array<string>, subject: string, body: string) => {
  return new SendEmailCommand({
    Destination: { ToAddresses: to },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: body } },
    },
    Source: env.SMTP_FROM,
  });
};

export type Email = typeof email;

export const email = {
  buildConfig,
  client: new SESClient({
    region: env.SMTP_HOST,
    credentials: {
      accessKeyId: env.SMTP_USER,
      secretAccessKey: env.SMTP_PASSWORD,
    },
  }),
};

export const injectEmailMiddleware = createMiddleware<Ctx>(async (c, n) => {
  c.set("email", email);
  await n();
});
