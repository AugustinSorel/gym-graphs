import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { env } from "~/env";

export const email = new SESClient({
  region: env.SMTP_HOST,
  credentials: {
    accessKeyId: env.SMTP_USER,
    secretAccessKey: env.SMTP_PASSWORD,
  },
});

export const emailConfig = (
  to: Array<string>,
  subject: string,
  body: string,
) => {
  return new SendEmailCommand({
    Destination: { ToAddresses: to },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: body } },
    },
    Source: env.SMTP_FROM,
  });
};
