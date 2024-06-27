import { env } from "@/env.mjs";
import { TeamInvite } from "@/server/db/types";
import nodemailer from "nodemailer";
import type { Options } from "nodemailer/lib/mailer";
import { getBaseUrl } from "./utils";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_SERVER_USER,
    pass: env.EMAIL_SERVER_PASSWORD,
  },
});

export const sendInviteToTeamEmail = async (
  props: Pick<Options, "to"> & Pick<TeamInvite, "token">,
) => {
  console.log(
    `${getBaseUrl()}/join-team`,
    "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<,,",
  );
  return transporter.sendMail({
    from: env.EMAIL_FROM,
    to: props.to,
    subject: "Join team",
    html: `
        <h1>hello world</h1>
        <a href=${getBaseUrl()}/join-team?token=${
          props.token
        } target="_blank">join</a>
    `,
  });
};
