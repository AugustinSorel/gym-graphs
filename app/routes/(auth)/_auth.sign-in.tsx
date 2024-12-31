import { createFileRoute, Link } from "@tanstack/react-router";
import { ComponentProps } from "react";
import { Button } from "~/components/ui/button";
import { EmailSignIn } from "~/features/auth/components/email-sign-in";

export const Route = createFileRoute("/(auth)/_auth/sign-in")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Title>welcome back</Title>

      <EmailSignIn />

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
}

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
