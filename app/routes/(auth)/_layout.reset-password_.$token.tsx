import { createFileRoute, Link } from "@tanstack/react-router";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { Button } from "~/ui/button";
import { ResetPasswordForm } from "~/auth/components/reset-password-form";
import { permissions } from "~/libs/permissions";
import type { ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/_layout/reset-password_/$token")({
  beforeLoad: ({ context }) => {
    permissions.resetPassword.view(context.user);
  },
  component: () => RouteComponent(),
  errorComponent: (props) => ErrorComponent(props),
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

const ErrorComponent = (props: ErrorComponentProps) => {
  return (
    <>
      <Title>welcome back</Title>

      <DefaultErrorFallback {...props} />

      <RedirectText>
        something went wrong?{" "}
        <Button
          variant="link"
          asChild
          className="text-primary h-auto w-auto p-0"
        >
          <Link to="/reset-password">request another email</Link>
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
