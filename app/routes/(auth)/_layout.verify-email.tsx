import { createFileRoute } from "@tanstack/react-router";
import { validateAccess } from "~/libs/permissions.lib";
import { VerifyEmailForm } from "~/auth/components/verify-email-form";
import { ResendEmailVerificationCode } from "~/auth/components/resend-email-verification-code";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(auth)/_layout/verify-email")({
  beforeLoad: ({ context }) => {
    validateAccess("verifyEmail", "view", context.user);
  },
  component: () => RouteComponent(),
});

const RouteComponent = () => {
  return (
    <>
      <Title>verify email</Title>
      <VerifyEmailForm />
      <ResendEmailVerificationCode />
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
