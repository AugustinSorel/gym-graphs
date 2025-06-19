import { redirect } from "@tanstack/react-router";
import type { selectSessionTokenAction } from "~/auth/auth.actions";
import type { selectUserAction } from "~/user/user.actions";
import type { TeamMember } from "~/db/db.schemas";

type ServerUser = Readonly<
  Partial<
    NonNullable<Awaited<ReturnType<typeof selectSessionTokenAction>>>
  >["user"]
>;

type ClientUser = Readonly<Awaited<ReturnType<typeof selectUserAction>>>;

export const permissions = {
  homePage: {
    view: (user: ServerUser) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }

      return user;
    },
  },
  dashboard: {
    view: (user: ServerUser) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  teams: {
    view: (user: ServerUser) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  team: {
    view: (user: ServerUser) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
    isAdmin: (user: ClientUser, members: ReadonlyArray<TeamMember>) => {
      const userInTeam = members.find((member) => {
        return member.userId === user?.id;
      });

      return userInTeam?.role === "admin";
    },
    acceptInvite: (user: ServerUser, callbackUrl: string) => {
      if (!user) {
        throw redirect({
          to: "/sign-up",
          search: { callbackUrl },
        });
      }

      return user;
    },
  },
  teamSettings: {
    view: (user: ServerUser) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  settings: {
    view: (user: ServerUser) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  exercise: {
    view: (user: ServerUser) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  exerciseSettings: {
    view: (user: ServerUser) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  signIn: {
    view: (user: ServerUser) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }

      return null;
    },
  },
  signUp: {
    view: (user: ServerUser) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }

      return null;
    },
  },
  verifyEmail: {
    view: (user: ServerUser) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }
    },
  },
  requestResetPassword: {
    view: (user: ServerUser) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }
    },
  },
  resetPassword: {
    view: (user: ServerUser) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }
    },
  },
} as const;
