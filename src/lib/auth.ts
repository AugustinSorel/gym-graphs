import { env } from "@/env.mjs";
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    EmailProvider({
      server: env.EMAIL_SERVER,
      from: env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
};

export const getSession = async () => {
  return getServerSession(authOptions);
};
