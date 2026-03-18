import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/ui/button";
import { ResetPasswordForm } from "~/domains/user/components/reset-password-form";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(auth)/_layout/reset-password_/$token")({
  component: () => RouteComponent(),
});

const RouteComponent = () => {
  return (
    <>
      <Title>reset your password</Title>

      <ResetPasswordForm />

      <RedirectText>
        something went wrong?{" "}
        <Button
          variant="link"
          asChild
          className="text-primary h-auto w-auto p-0"
        >
          <Link to="/reset-password">Request another email</Link>
        </Button>
      </RedirectText>
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

const RedirectText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="text-accent-foreground mt-16 text-center text-sm"
      {...props}
    />
  );
};
