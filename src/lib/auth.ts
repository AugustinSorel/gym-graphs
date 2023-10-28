import { env } from "@/env.mjs";
import { getServerSession } from "next-auth";
import type { DefaultSession, NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import EmailProvider from "next-auth/providers/email";
import { db } from "@/db";
import { exerciseGridPosition, exercises, exercisesData } from "@/db/schema";
import { addDays, addMonths } from "./date";
import { redirect } from "next/navigation";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}

const createUser = async ({ user }: { user: User }) => {
  await db.transaction(async (tx) => {
    const [benchPress, squat, deadlift] = await tx
      .insert(exercises)
      .values([
        { name: "bench press", userId: user.id },
        { name: "squat", userId: user.id },
        { name: "deadlift", userId: user.id },
      ])
      .returning();

    if (benchPress) {
      await tx
        .insert(exerciseGridPosition)
        .values({ exerciseId: benchPress.id, userId: user.id });

      await tx.insert(exercisesData).values([
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 20,
          weightLifted: 20,
          doneAt: addDays(addMonths(new Date(), -1), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 0),
          updatedAt: addDays(addMonths(new Date(), -1), 0),
        },
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 10,
          weightLifted: 10,
          doneAt: addDays(addMonths(new Date(), -1), 1).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 1),
          updatedAt: addDays(addMonths(new Date(), -1), 1),
        },
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 30,
          weightLifted: 30,
          doneAt: addDays(addMonths(new Date(), -1), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 2),
          updatedAt: addDays(addMonths(new Date(), -1), 2),
        },
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 20,
          weightLifted: 20,
          doneAt: addDays(addMonths(new Date(), -2), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 0),
          updatedAt: addDays(addMonths(new Date(), -2), 0),
        },
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 10,
          weightLifted: 10,
          doneAt: addDays(addMonths(new Date(), -2), 1).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 1),
          updatedAt: addDays(addMonths(new Date(), -2), 1),
        },
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 30,
          weightLifted: 30,
          doneAt: addDays(addMonths(new Date(), -2), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 2),
          updatedAt: addDays(addMonths(new Date(), -2), 2),
        },
      ]);
    }

    if (squat) {
      await tx
        .insert(exerciseGridPosition)
        .values({ exerciseId: squat.id, userId: user.id });

      await tx.insert(exercisesData).values([
        {
          exerciseId: squat.id,
          numberOfRepetitions: 10,
          weightLifted: 10,
          doneAt: addDays(addMonths(new Date(), -1), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 0),
          updatedAt: addDays(addMonths(new Date(), -1), 0),
        },
        {
          exerciseId: squat.id,
          numberOfRepetitions: 30,
          weightLifted: 30,
          doneAt: addDays(addMonths(new Date(), -1), 1).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 1),
          updatedAt: addDays(addMonths(new Date(), -1), 1),
        },
        {
          exerciseId: squat.id,
          numberOfRepetitions: 20,
          weightLifted: 20,
          doneAt: addDays(addMonths(new Date(), -1), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 2),
          updatedAt: addDays(addMonths(new Date(), -1), 2),
        },
        {
          exerciseId: squat.id,
          numberOfRepetitions: 20,
          weightLifted: 20,
          doneAt: addDays(addMonths(new Date(), -2), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 0),
          updatedAt: addDays(addMonths(new Date(), -2), 0),
        },
        {
          exerciseId: squat.id,
          numberOfRepetitions: 40,
          weightLifted: 40,
          doneAt: addDays(addMonths(new Date(), -2), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 2),
          updatedAt: addDays(addMonths(new Date(), -2), 2),
        },
      ]);
    }

    if (deadlift) {
      await tx
        .insert(exerciseGridPosition)
        .values({ exerciseId: deadlift.id, userId: user.id });

      await tx.insert(exercisesData).values([
        {
          exerciseId: deadlift.id,
          numberOfRepetitions: 30,
          weightLifted: 30,
          doneAt: addDays(addMonths(new Date(), -1), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 0),
          updatedAt: addDays(addMonths(new Date(), -1), 0),
        },
        {
          exerciseId: deadlift.id,
          numberOfRepetitions: 50,
          weightLifted: 50,
          doneAt: addDays(addMonths(new Date(), -1), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 2),
          updatedAt: addDays(addMonths(new Date(), -1), 2),
        },
        {
          exerciseId: deadlift.id,
          numberOfRepetitions: 40,
          weightLifted: 40,
          doneAt: addDays(addMonths(new Date(), -2), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 0),
          updatedAt: addDays(addMonths(new Date(), -2), 0),
        },
        {
          exerciseId: deadlift.id,
          numberOfRepetitions: 30,
          weightLifted: 30,
          doneAt: addDays(addMonths(new Date(), -2), 1).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 1),
          updatedAt: addDays(addMonths(new Date(), -2), 1),
        },
        {
          exerciseId: deadlift.id,
          numberOfRepetitions: 20,
          weightLifted: 20,
          doneAt: addDays(addMonths(new Date(), -2), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 2),
          updatedAt: addDays(addMonths(new Date(), -2), 2),
        },
      ]);
    }
  });
};

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id,
      },
    }),
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        auth: {
          user: env.EMAIL_SERVER_USER,
          pass: env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: env.EMAIL_FROM,
    }),
  ],
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/verify-request",
  },
  events: {
    createUser,
  },
};

export const getSession = async () => {
  return getServerSession(authOptions);
};

export const redirectIfSignedIn = async () => {
  const session = await getServerSession(authOptions);

  if (session?.user.id) {
    return redirect("/dashboard");
  }
};
