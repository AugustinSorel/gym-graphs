import { createFileRoute } from "@tanstack/react-router";
import { RequestResetPasswordForm } from "~/domains/user/components/request-reset-password-form";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(auth)/_layout/reset-password")({
  component: () => RouteComponent(),
});

const RouteComponent = () => {
  return (
    <>
      <Title>reset your password</Title>

      <RequestResetPasswordForm />
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
