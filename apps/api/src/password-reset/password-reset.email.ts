import type { PasswordResetToken } from "~/db/db.schemas";

export const passwordResetEmailBody = (token: PasswordResetToken["token"]) => {
  //FIX
  const base = "http://localhost:3000";

  const url = `${base}/reset-password/${token}`;

  return `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>verification code</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            }

            .text-primary {
              color: hsl(0,0%,4%);
            }

            .bg-transparent {
              background-color: transparent;
            }

            .max-w {
              max-width: 30rem;
            }

            .mx-auto {
              margin: 0 auto;
            }

            .px-4 {
              padding-left: 2rem;
              padding-right: 2rem;
            }

            .p-4 {
              padding: 2rem;
            }

            .py-1 {
              padding-top: 0.75rem;
              padding-bottom: 0.75rem;
            }

            .bg-accent {
              background-color: hsl(230,50%,60%);
            }

            .text-accent-foreground {
              color: hsl(0,0%,96%);
            }

            .rounded-md {
              border-radius: 0.5rem
            }

            .text-center {
              text-align: center;
            }

            .inline-block {
              display: inline-block;
            }

            .width-full {
              width: 100%;
            }

            .text-xs {
              font-size: 0.8rem;
            }

            .text-sm {
              font-size: 0.9rem;
            }

            .text-base {
              font-size: 1rem;
            }

            .text-lg {
              font-size: 1.25rem;
            }

            .text-2xl {
              font-size: 2rem;
            }

            .font-bold {
              font-weight: bold;
            }

            .my-2 {
              margin-top: 1rem;
              margin-bottom: 1rem;
            }

            .my-4 {
              margin-top: 2rem;
              margin-bottom: 2rem;
            }

            .my-1 {
              margin-top: 0.5rem;
              margin-bottom: 0.5rem;
            }

            .mt-1 {
              margin-top: 0.5rem;
            }

            .text-muted-foreground {
              color: hsl(0,0%,40%);
            }

            .decoration-none {
              text-decoration: none;
            }
          </style>
        </head>

        <body class='text-foreground p-4'>
          <div class="mx-auto max-w text-center">
            <h1 class='text-2xl text-primary'>Reset your password</h1>
            <p class='text-muted-foreground text-sm mt-1'>
              Click the link below to reset your password
            </p>
            <a
              href="${url}"
              class='bg-accent rounded-md py-1 width-full inline-block text-center text-lg font-bold my-4 decoration-none'
              target="_blank"
            >
              <strong class='text-accent-foreground'>reset</strong>
            </a>
            <p class='text-muted-foreground text-xs'>
              This code is only active for the next 15 minutes. Once this code expires you will have to resubmit a request.
              <br />
              If you didn't request this email, you can safely ignore it. 
            </p>
          </div>
        </body>
      </html>
        `;
};
