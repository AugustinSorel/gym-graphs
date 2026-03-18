import { createFileRoute } from "@tanstack/react-router";
import { VerifyEmailForm } from "~/domains/user/components/verify-email-form";
import { ResendEmailVerificationCode } from "~/domains/user/components/resend-email-verification-code";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(auth)/_layout/verify-email")({
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
