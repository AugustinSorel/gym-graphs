import { redirect } from "@tanstack/react-router";
import type { selectSessionTokenAction } from "~/auth/auth.actions";

type User = Readonly<
  Partial<
    NonNullable<Awaited<ReturnType<typeof selectSessionTokenAction>>>
  >["user"]
>;

export const permissions = {
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
  exzerciseSettings: {
    view: (user: User) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  signIn: {
    view: (user: User) => {
      if (user) {
        throw redirect({ to: "/dashboard" });
      }

      return null;
    },
  },
  signUp: {
    view: (user: User) => {
      if (user) {
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

      if (user && !user.emailVerifiedAt) {
        throw redirect({ to: "/verify-email" });
      }
    },
  },
  resetPassword: {
    view: (user: User) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }

      if (user && !user.emailVerifiedAt) {
        throw redirect({ to: "/verify-email" });
      }
    },
  },
} as const;
