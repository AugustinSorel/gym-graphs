import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/ui/button";
import { EmailSignInForm } from "~/domains/user/components/email-sign-in-form";
import { GithubSignIn } from "~/domains/oauth/components/github-sign-in";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(auth)/_layout/sign-in")({
  component: () => RouteComponent(),
});

const RouteComponent = () => {
  return (
    <>
      <Title>welcome back</Title>

      <EmailSignInForm />

      <GithubSignIn />

      <RedirectText>
        don&apos;t have an account?{" "}
        <Button
          variant="link"
          asChild
          className="text-primary h-auto w-auto p-0"
        >
          <Link
            to="/sign-up"
            search={(prev) => ({ callbackUrl: prev.callbackUrl })}
          >
            sign up
          </Link>
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
