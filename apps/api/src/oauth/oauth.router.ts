import { Hono } from "hono";
import {
  generateGithubOAuthUrl,
  generateOAuthState,
} from "~/oauth/oauth.utils";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { getCookie, setCookie } from "hono/cookie";
import { oauthCookies } from "./oauth.cookies";
import { oauthService } from "./oauth.service";
import { githubOAuthCallbackQuerySchema } from "@gym-graphs/schemas/oauth";
import { sessionCookie } from "~/session/session.cookies";
import { HTTPException } from "hono/http-exception";
import type { Ctx } from "~/index";

export const oauthRouter = new Hono<Ctx>()
  .post(
    "/github",
    zValidator(
      "query",
      z.object({ callbackUrl: z.string().optional() }).optional(),
    ),
    async (c) => {
      const query = c.req.valid("query");

      const state = generateOAuthState();

      const url = generateGithubOAuthUrl(
        state,
        ["user:email"],
        query?.callbackUrl,
      );

      setCookie(
        c,
        oauthCookies.github.name,
        state,
        oauthCookies.github.options,
      );

      return c.redirect(url);
    },
  )
  .post(
    "/github/callback",
    zValidator("query", githubOAuthCallbackQuerySchema),
    async (c) => {
      try {
        const query = c.req.valid("query");
        const candidateState = getCookie(c, oauthCookies.github.name);

        if (candidateState !== query.state) {
          throw new HTTPException(401, { message: "state do not match" });
        }

        const tokens = await oauthService.validateGithubOAuthCode(query.code);

        const session = await oauthService.githubSignIn(
          tokens.accessToken,
          c.var.db,
        );

        setCookie(
          c,
          sessionCookie.name,
          session.token,
          sessionCookie.optionsForExpiry(session.session.expiresAt),
        );

        return c.redirect(query.redirectUri ? query.redirectUri : "/dashboard");
      } catch (e) {
        const errorMsg =
          e instanceof Error ? e.message : "something went wrong";

        //FIX:
        const base = "http://localhost:3000";
        return c.redirect(
          `${base}/sign-up?error=${encodeURIComponent(errorMsg)}`,
        );
      }
    },
  );
