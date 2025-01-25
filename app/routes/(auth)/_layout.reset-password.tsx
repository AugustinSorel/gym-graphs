import { createFileRoute, redirect } from "@tanstack/react-router";
import { RequestResetPasswordForm } from "~/auth/components/request-reset-password-form";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(auth)/_layout/reset-password")({
  beforeLoad: ({ context }) => {
    if (context.user?.emailVerifiedAt) {
      throw redirect({ to: "/dashboard" });
    }

    if (context.user && !context.user.emailVerifiedAt) {
      throw redirect({ to: "/verify-email" });
    }
  },
  component: () => RouteComponent(),
  errorComponent: (props) => ErrorComponent(props),
});

const RouteComponent = () => {
  return (
    <>
      <Title>reset your password</Title>

      <RequestResetPasswordForm />
    </>
  );
};

const ErrorComponent = (props: ErrorComponentProps) => {
  return (
    <>
      <Title>reset password</Title>

      <DefaultErrorFallback {...props} />
    </>
  );
};

const Title = (props: ComponentProps<"h2">) => {
  return (
    <h2
      className="mb-16 text-center text-2xl font-semibold capitalize"
      {...props}
    />
  );
};
