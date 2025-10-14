import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { createMiddleware } from "hono/factory";
import { env } from "~/env";
import type { Ctx } from "~/index";

export type Email = typeof email;

export const email = new SESClient({
  region: env.SMTP_HOST,
  credentials: {
    accessKeyId: env.SMTP_USER,
    secretAccessKey: env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (
  to: Array<string>,
  subject: string,
  html: string,
  email: Email,
) => {
  const config = new SendEmailCommand({
    Destination: { ToAddresses: to },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: html } },
    },
    Source: env.SMTP_FROM,
  });

  await email.send(config);
};

export const injectEmailMiddleware = createMiddleware<Ctx>(async (c, n) => {
  c.set("email", email);
  await n();
});
