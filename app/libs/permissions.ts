import { redirect } from "@tanstack/react-router";
import { validateSessionToken } from "~/auth/auth.services";

type User = Readonly<
  NonNullable<Awaited<ReturnType<typeof validateSessionToken>>>["user"]
>;

const permissions = {
  dashboard: {
    view: (user?: User) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  settings: {
    view: (user?: User) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  exercise: {
    view: (user?: User) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  exzerciseSettings: {
    view: (user?: User) => {
      if (!user?.emailVerifiedAt) {
        throw redirect({ to: "/sign-in" });
      }

      return user;
    },
  },
  signIn: {
    view: (user?: User) => {
      if (user) {
        throw redirect({ to: "/dashboard" });
      }

      return null;
    },
  },
  signUp: {
    view: (user?: User) => {
      if (user) {
        throw redirect({ to: "/dashboard" });
      }

      return null;
    },
  },
  verifyEmail: {
    view: (user?: User) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }
    },
  },
  requestResetPassword: {
    view: (user?: User) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }

      if (user && !user.emailVerifiedAt) {
        throw redirect({ to: "/verify-email" });
      }
    },
  },
  resetPassword: {
    view: (user?: User) => {
      if (user?.emailVerifiedAt) {
        throw redirect({ to: "/dashboard" });
      }

      if (user && !user.emailVerifiedAt) {
        throw redirect({ to: "/verify-email" });
      }
    },
  },
} as const;

type ExtractFn<Fn> = Fn extends (...props: any) => any ? Fn : never;

export const validateAccess = <
  TPermission extends keyof typeof permissions,
  TAction extends keyof (typeof permissions)[TPermission],
  TFn extends ExtractFn<(typeof permissions)[TPermission][TAction]>,
>(
  entity: TPermission,
  action: TAction,
  ...data: Parameters<TFn>
) => {
  const permission = permissions[entity][action] as TFn;

  return permission(...data) as ReturnType<TFn>;
};
