import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/ui/button";
import { EmailSignInForm } from "~/auth/components/email-sign-in-form";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { GithubSignIn } from "~/auth/components/github-sign-in";
import { permissions } from "~/libs/permissions";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(auth)/_layout/sign-in")({
  beforeLoad: ({ context }) => {
    permissions.signIn.view(context.user);
  },
  component: () => RouteComponent(),
  errorComponent: (props) => ErrorComponent(props),
});

const RouteComponent = () => {
  return (
    <>
      <Title>welcome back</Title>

      <EmailSignInForm />

      <GithubSignIn />

      <RedirectText>
        don't have an account?{" "}
        <Button
          variant="link"
          asChild
          className="text-primary h-auto w-auto p-0"
        >
          <Link to="/sign-up">sign up</Link>
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
        don't have an account?{" "}
        <Button
          variant="link"
          asChild
          className="text-primary h-auto w-auto p-0"
        >
          <Link to="/sign-up">sign up</Link>
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
