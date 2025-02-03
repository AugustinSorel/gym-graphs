import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/ui/button";
import { EmailSignUpForm } from "~/auth/components/email-sign-up-form";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { GithubSignIn } from "~/auth/components/github-sign-in";
import { validateAccess } from "~/libs/permissions";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(auth)/_layout/sign-up")({
  beforeLoad: ({ context }) => {
    validateAccess("signUp", "view", context.session?.user);
  },
  component: () => RouteComponent(),
  errorComponent: (props) => ErrorComponent(props),
});

const RouteComponent = () => {
  return (
    <>
      <Title>welcome</Title>

      <EmailSignUpForm />

      <GithubSignIn />

      <RedirectText>
        already have an account?{" "}
        <Button
          variant="link"
          asChild
          className="h-auto w-auto p-0 text-primary"
        >
          <Link to="/sign-in">sign in</Link>
        </Button>
      </RedirectText>
    </>
  );
};

const ErrorComponent = (props: ErrorComponentProps) => {
  return (
    <>
      <Title>welcome</Title>

      <DefaultErrorFallback {...props} />

      <RedirectText>
        already have an account?{" "}
        <Button
          variant="link"
          asChild
          className="h-auto w-auto p-0 text-primary"
        >
          <Link to="/sign-in">sign in</Link>
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
      className="mt-16 text-center text-sm text-accent-foreground"
      {...props}
    />
  );
};
