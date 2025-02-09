import { redirect } from "@tanstack/react-router";
import type { selectSessionTokenAction } from "~/auth/auth.actions";

type User = Readonly<
  Partial<
    NonNullable<Awaited<ReturnType<typeof selectSessionTokenAction>>>
  >["user"]
>;

export const permissions = {
  homePage: {
    view: (user: User) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }

      return user;
    },
  },
  dashboard: {
    view: (user: User) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  settings: {
    view: (user: User) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  exercise: {
    view: (user: User) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  exerciseSettings: {
    view: (user: User) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  signIn: {
    view: (user: User) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }

      return null;
    },
  },
  signUp: {
    view: (user: User) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }

      return null;
    },
  },
  verifyEmail: {
    view: (user: User) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }
    },
  },
  requestResetPassword: {
    view: (user: User) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }
    },
  },
  resetPassword: {
    view: (user: User) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }
    },
  },
} as const;
