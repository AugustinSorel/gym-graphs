import { env } from "@/env.mjs";
import type { TeamInvite } from "@/server/db/types";
import nodemailer from "nodemailer";
import type { Options } from "nodemailer/lib/mailer";
import { getBaseUrl } from "./utils";
import type { SendVerificationRequestParams } from "next-auth/providers/email";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_SERVER_USER,
    pass: env.EMAIL_SERVER_PASSWORD,
  },
});

export const sendSignInEmail = async (props: SendVerificationRequestParams) => {
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: props.identifier,
    subject: "You're Invited to Join a new Team!",
    html: `
      <body>
        <table 
          width="100%" 
          border="0" 
          cellspacing="0" 
          cellpadding="0"
          style="background: #f9f9f9; max-width: 600px; margin: auto; border-radius: 6px; font-family: Helvetica, Arial, sans-serif; padding: 1rem;"
        >
          <tr>
            <td style="display: flex;">
              <img 
                src="https://gym-graphs.vercel.app/icon-email.png"
                height="24"
                width="24"
                style="margin-top: auto; margin-bottom: auto; margin-left: auto;"
              />

              <h1 style="font-size: 1rem; font-weight: bold; margin-top: auto; margin-bottom: auto; margin-right: auto; margin-left:0.5rem;">Gym Graphs</h1>
            </td>
          </tr>
          <tr>
            <td style="display: flex; margin-top: 2rem;">
              <h2 style="font-weight: bold; font-size: 2rem; margin: 0 auto;">Let's sign you in</h2>
            </td>
          </tr>
          <tr>
            <td style="display: flex; font-size: 1rem; text-align: center; margin-top: 1rem;">
              <p style="margin: auto;">Click the button below to sign in to Gym Graphs</p>
            </td>
          </tr>
          <tr>
            <td style="display: flex; font-size: 1rem; text-align: center;">
              <p style="margin: auto;">This button will expires in 15 minutes</p>
            </td>
          </tr>
          <tr>
            <td style="display: flex; margin: 3rem 0;">
              <a
                target="_blank"
                style="font-size: 1.25rem; color: #fff; text-decoration: none; border-radius: 5px; padding: 10px 20px; font-weight: bold; margin: auto; background-color: hsl(329,82%,65%); width: 300px; text-align: center;"
                href=${props.url}
              >
                Sign In
              </a>
            </td>
          </tr>
          <tr>
            <td style="font-size: 1rem; text-align: center;">
              <p style="margin: 0;">
                Confirming this request will securely <br/> 
                sign you in using <a style="color: hsl(329,82%,65%); text-decoration: none;">${props.identifier}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="display: flex; font-size: 1rem; text-align: center; margin-top: 1rem">
              <p style="color: #808080; font-size: 1rem; margin: auto">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </body>
    `,
  });
};

export const sendInviteToTeamEmail = async (
  props: Pick<Options, "to"> & Pick<TeamInvite, "token">,
) => {
  return transporter.sendMail({
    from: env.EMAIL_FROM,
    to: props.to,
    subject: "Sign in to Gym Graphs !",
    html: `
      <body>
        <table 
          width="100%" 
          border="0" 
          cellspacing="0" 
          cellpadding="0"
          style="background: #f9f9f9; max-width: 600px; margin: auto; border-radius: 6px; font-family: Helvetica, Arial, sans-serif; padding: 1rem;"
        >
          <tr>
            <td style="display: flex;">
              <img 
                src="https://github.com/user-attachments/assets/03e99ea9-1fc3-4210-a17e-eca1e4a7ec0c"
                height="24"
                width="24"
                style="margin-top: auto; margin-bottom: auto; margin-left: auto;"
              />

              <h1 style="font-size: 1rem; font-weight: bold; margin-top: auto; margin-bottom: auto; margin-right: auto; margin-left:0.5rem;">Gym Graphs</h1>
            </td>
          </tr>
          <tr>
            <td style="display: flex; margin-top: 2rem;">
              <h2 style="font-weight: bold; font-size: 2rem; margin: 0 auto;">Join your new team</h2>
            </td>
          </tr>
          <tr>
            <td style="display: flex; font-size: 1rem; text-align: center; margin-top: 1rem;">
              <p style="margin: auto;">Click the button below to join</p>
            </td>
          </tr>
          <tr>
            <td style="display: flex; font-size: 1rem; text-align: center;">
              <p style="margin: auto;">This button will expires in 7 days</p>
            </td>
          </tr>
          <tr>
            <td style="display: flex; margin: 3rem 0;">
              <a
                target="_blank"
                style="font-size: 1.25rem; color: #fff; text-decoration: none; border-radius: 5px; padding: 10px 20px; font-weight: bold; margin: auto; background-color: hsl(329,82%,65%); width: 300px; text-align: center;"
                href="${getBaseUrl()}/join-team?token=${props.token}"
              >
                Join
              </a>
            </td>
          </tr>
          <tr>
            <td style="display: flex; font-size: 1rem; text-align: center; margin-top: 1rem">
              <p style="color: #808080; font-size: 1rem; margin: auto">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </body>
    `,
  });
};
