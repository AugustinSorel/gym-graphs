import {
  createFileRoute,
  ErrorComponentProps,
  Link,
  redirect,
} from "@tanstack/react-router";
import { ComponentProps } from "react";
import { Button } from "~/features/ui/button";
import { EmailSignInForm } from "~/features/auth/components/email-sign-in-form";
import { DefaultErrorFallback } from "~/features/components/default-error-fallback";

export const Route = createFileRoute("/_auth/sign-in")({
  beforeLoad: ({ context }) => {
    if (context.user && context.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => RouteComponent(),
  errorComponent: (props) => ErrorComponent(props),
});

const RouteComponent = () => {
  return (
    <>
      <Title>welcome back</Title>

      <EmailSignInForm />

      <RedirectText>
        don't have an account?{" "}
        <Button
          variant="link"
          asChild
          className="h-auto w-auto p-0 text-primary"
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
          className="h-auto w-auto p-0 text-primary"
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
      className="mt-16 text-center text-sm text-accent-foreground"
      {...props}
    />
  );
};
