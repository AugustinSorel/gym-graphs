import { env } from "@/env.mjs";
import type { TeamInvite } from "@/server/db/types";
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
  return transporter.sendMail({
    from: env.EMAIL_FROM,
    to: props.to,
    subject: "You're Invited to Join a new Team!",
    html: `
      <body>
        <table width="100%" border="0" cellspacing="20" cellpadding="0"
          style="max-width: 600px; margin: auto; border-radius: 10px;">
          <tr>
            <td align="center"
              style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: #000;">
              Join your new team
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 5px;" bgcolor="#0047AB">
                    <a href="${getBaseUrl()}/join-team?token=${props.token}"
                        target="_blank"
                        style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #fff; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid #808080; display: inline-block; font-weight: bold;"
                    >
                      Join
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center"
              style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: #808080;">
              If you did not request this email you can safely ignore it.
            </td>
          </tr>
        </table>
      </body>    `,
  });
};
